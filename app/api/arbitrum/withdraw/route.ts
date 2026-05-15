import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import {
  getProvider,
  getAccountBalance,
  transferUsdt,
  type AccountBalance,
} from "@/lib/arbitrum/utils";
import { ACTIVE_USDT_CONTRACT } from "@/lib/arbitrum/config";
import { waitForConfirmation } from "../../../../server/arbitrumService";
import { WITHDRAW_FEES, MIN_WITHDRAWAL } from "@/constants";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
if (!convexUrl) {
  throw new Error(
    "Missing Convex URL: set NEXT_PUBLIC_CONVEX_URL or CONVEX_URL in your environment",
  );
}
const convex = new ConvexHttpClient(convexUrl);

// Simple custom hash function (matches convex/user.ts)
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

// small helper
function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// Helper to validate Arbitrum address format
function isValidArbitrumAddress(address: string) {
  try {
    const { ethers } = require('ethers');
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.contact) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, network, address, transactionPassword } = body;
    const amountFloat = parseFloat(String(amount ?? ""));

    if (!amount || !network || !address || Number.isNaN(amountFloat)) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 },
      );
    }

    if (amountFloat < MIN_WITHDRAWAL) {
      return NextResponse.json(
        { error: `Minimum withdrawal is ${MIN_WITHDRAWAL} USDT` },
        { status: 400 },
      );
    }

    if (amountFloat <= WITHDRAW_FEES) {
      return NextResponse.json(
        { error: `Amount must be greater than withdrawal fees (${WITHDRAW_FEES} USDT)` },
        { status: 400 },
      );
    }

    if (network !== "erc20") {
      return NextResponse.json(
        { error: "Only ERC20 withdrawals are currently supported" },
        { status: 400 },
      );
    }

    // Validate destination address format
    if (!isValidArbitrumAddress(address)) {
      return NextResponse.json(
        { error: "Invalid Arbitrum address" },
        { status: 400 },
      );
    }

    // Check if destination address is a contract (contracts can't receive ETH for gas)
    try {
      const provider = await getProvider();
      const code = await provider.getCode(address);
      if (code !== '0x') {
        return NextResponse.json(
          { error: "Cannot withdraw to contract addresses" },
          { status: 400 },
        );
      }
    } catch (contractCheckErr: any) {
      console.warn(`Could not verify if address is contract: ${contractCheckErr?.message}`);
      // Continue anyway - better to let the transaction proceed and fail later than block valid withdrawals
    }

    // 1. Get User ID from Convex
    let user;
    try {
      user = await convex.query(api.user.getUserByContact, {
        contact: session.user.contact,
      });
    } catch (convexErr: any) {
      console.error('Convex query failed:', convexErr);
      return NextResponse.json(
        {
          error:
            'Server configuration error: unable to reach Convex. Check NEXT_PUBLIC_CONVEX_URL / CONVEX_URL and network connectivity.',
        },
        { status: 500 },
      );
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const withdrawAmount = amountFloat - WITHDRAW_FEES;


    // Check if user can bypass password verification (24 hours since forgotten)
    const canBypass = await convex.query(
      api.user.canBypassPasswordVerification,
      {
        userId: user._id,
      },
    );

    // Verify transaction password OR check 24-hour bypass
    if (!canBypass) {
      // Password verification is required if not bypassing
      if (!transactionPassword || typeof transactionPassword !== "string") {
        return NextResponse.json(
          { error: "Missing transaction password" },
          { status: 400 },
        );
      }
      try {
        const storedHash = user.transactionPassword || "";
        if (
          !storedHash ||
          typeof storedHash !== "string" ||
          storedHash.trim().length === 0
        ) {
          console.warn(
            `User ${user._id} attempted withdrawal but has no transaction password configured.`,
          );
          return NextResponse.json(
            { error: "Transaction password not configured for account" },
            { status: 400 },
          );
        }

        const hashedInput = simpleHash(transactionPassword);
        if (hashedInput !== storedHash) {
          return NextResponse.json(
            { error: "Invalid transaction password" },
            { status: 401 },
          );
        }
      } catch (e) {
        console.error("Transaction password verification error:", e);
        return NextResponse.json(
          { error: "Failed to verify transaction password" },
          { status: 500 },
        );
      }
    } else {
      console.log(
        `User ${user._id} bypassed password verification (24 hours since marked forgotten)`,
      );
      // Clear the forgotten timestamp after successful bypass
      await convex.mutation(api.user._updateForgottenTimestamp, {
        userId: user._id,
        timestamp: undefined,
      });
    }

    // Validate server configuration and hot-wallet balances BEFORE creating a pending withdrawal
    const privateKey = process.env.MAIN_WALLET_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        { error: "Server configuration error: Missing hot wallet key" },
        { status: 500 },
      );
    }

    if (!ACTIVE_USDT_CONTRACT) {
      return NextResponse.json(
        { error: "Server configuration error: Missing USDT contract address" },
        { status: 500 },
      );
    }

    // Derive hot wallet address from private key
    const { ethers } = require('ethers');
    const provider = await getProvider();
    const wallet = new ethers.Wallet(privateKey, provider);
    const hotAddress = wallet.address;

    // Check hot wallet balances
    let initialHotWalletBalance: AccountBalance;
    try {
      initialHotWalletBalance = await getAccountBalance(hotAddress);

      console.log(`Hot wallet balances - ETH: ${initialHotWalletBalance.eth}, USDT: ${initialHotWalletBalance.usdt}`);

      if ((initialHotWalletBalance.usdt || 0) < amountFloat) {
        console.error(
          `Hot wallet insufficient USDT: has ${initialHotWalletBalance.usdt}, needs ${amountFloat}`,
        );
        return NextResponse.json(
          {
            error:
              "Withdrawals are disabled for 7 days. Countdown has started.",
            details: "Please try again after 7 days.",
          },
          { status: 503 },
        );
      }
      // Ensure there's some ETH for fees (require at least 0.001 ETH for safety)
      if ((initialHotWalletBalance.eth || 0) < 0.001) {
        console.error(`Hot wallet insufficient ETH for fees: ${initialHotWalletBalance.eth}`);
        return NextResponse.json(
          {
            error:
              "Withdrawals are disabled for 7 days. Countdown has started.",
            details: "Please try again after 7 days.",
          },
          { status: 503 },
        );
      }
    } catch (err) {
      console.error("Failed to fetch hot wallet balances:", err);
      return NextResponse.json(
        { error: "Failed to verify hot wallet status" },
        { status: 500 },
      );
    }

    // 2. Request Withdrawal in Convex (deducts FULL balance, creates pending tx)
    // Record the user's destination address in the transaction record.
    let transactionId;
    try {
      transactionId = await convex.mutation(api.withdrawal.requestWithdrawal, {
        userId: user._id,
        amount: amountFloat, // Deduct FULL amount from user balance
        address: address, // user's destination address
        network: "erc20",
        transactionPassword: transactionPassword, // Save transaction password for audit
        withdrawalAddress: address, // Save withdrawal address for audit
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || "Failed to create withdrawal request" },
        { status: 400 },
      );
    }

    // 3. Process withdrawal on Arbitrum Blockchain (with retries and improved logging)
    try {
      console.log(`Processing withdrawal: ${withdrawAmount} USDT to ${address}`);
      console.log(`Contract: ${ACTIVE_USDT_CONTRACT}`);

      // ⭐ ADDRESS CHECK: Verify destination address is valid on Arbitrum
      try {
        const provider = await getProvider();
        const code = await provider.getCode(address);
        const isContract = code !== '0x';

        if (isContract) {
          console.log(`⚠️ Destination address ${address} is a contract`);
        } else {
          console.log(`Destination address is an externally owned account`);
        }
      } catch (balanceCheckErr: any) {
        console.error(
          `⚠️ Failed to verify destination address type: ${balanceCheckErr?.message || balanceCheckErr}`,
        );
      }

      // Helper to attempt the transfer with retries
      const maxRetries = 3;
      let lastError: any = null;
      let txHash: string | null = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          console.log(`\n🔄 Transfer attempt ${attempt + 1}/${maxRetries}`);
          console.log(`   From: ${hotAddress}`);
          console.log(`   To: ${address}`);
          console.log(`   Amount: ${withdrawAmount} USDT`);

          // Send USDT from hot wallet to the user's destination address
          const transferResult = await transferUsdt(privateKey, address, withdrawAmount);

          if (transferResult.success && transferResult.transactionId) {
            txHash = transferResult.transactionId;
            console.log(`Transfer succeeded on attempt ${attempt + 1}:`, txHash);

            // ⭐ CRITICAL: Verify txHash exists on blockchain before confirming
            let txVerified = false;
            const maxVerifyAttempts = 30; // More attempts for Arbitrum
            for (
              let verifyAttempt = 0;
              verifyAttempt < maxVerifyAttempts;
              verifyAttempt++
            ) {
              await sleep(2000); // 2 second intervals for Arbitrum
              try {
                const provider = await getProvider();
                const receipt = await waitForConfirmation(provider, txHash);
                if (receipt && receipt.status === 1) {
                  txVerified = true;
                  console.log(
                    `✅ TxHash verified on blockchain after ${verifyAttempt + 1} attempts: ${txHash}`,
                  );
                  break;
                }
              } catch (verifyErr) {
                console.log(
                  `Verification attempt ${verifyAttempt + 1}/${maxVerifyAttempts} for ${txHash}: Network/API error, retrying...`,
                );
              }
            }

            if (!txVerified) {
              console.warn(
                `⚠️ TxHash ${txHash} not confirmed on blockchain after ${maxVerifyAttempts} attempts (${maxVerifyAttempts * 2}s timeout).`,
              );
              console.warn(
                `   Network may be congested or tx failed. Checking hot wallet balance as fallback...`,
              );

              // FALLBACK: Check if funds actually left the hot wallet
              try {
                await sleep(5000);
                const hotWalletBal = await getAccountBalance(hotAddress);

                console.log(
                  `📊 Hot wallet balance check: Expected decrease of ${withdrawAmount} USDT, Current USDT: ${hotWalletBal.usdt} USDT`,
                );

                // Only consider it successful if we have a significant decrease
                if ((hotWalletBal.usdt || 0) <= (initialHotWalletBalance.usdt || 0) - withdrawAmount * 0.99) {
                  console.log(
                    `✅ FALLBACK VERIFIED: Funds left hot wallet. Balance: ${hotWalletBal.usdt} USDT`,
                  );
                  txVerified = true;
                } else {
                  console.error(
                    `❌ FALLBACK FAILED: Hot wallet balance (${hotWalletBal.usdt}) verification inconclusive. Expected at most ${(initialHotWalletBalance.usdt || 0) - withdrawAmount * 0.99} USDT`,
                  );
                }
              } catch (fallbackErr) {
                console.error(`❌ Fallback balance check error:`, fallbackErr);
                lastError = fallbackErr;
              }
            }

            if (!txVerified) {
              console.error(
                `❌ CRITICAL: TxHash ${txHash} not confirmed and fallback check failed. Marking as failed to refund.`,
              );
              lastError = new Error(
                `Transaction not confirmed on blockchain within timeout (30 attempts, fallback failed)`,
              );
              continue;
            }

            // write completed status only after verification
            await convex.mutation(api.withdrawal.completeWithdrawal, {
              transactionId,
              status: "completed",
              transactionHash: txHash,
            });

            return NextResponse.json({
              success: true,
              txId: txHash,
              message: "Withdrawal successful",
            });
          } else {
            // Transfer failed
            console.error(`Transfer failed on attempt ${attempt + 1}:`, transferResult.error);
            lastError = new Error(transferResult.error || 'Transfer failed');
            continue;
          }

          // If no txHash, treat as error
          lastError = new Error(
            "No transaction hash returned from Arbitrum transfer",
          );
        } catch (err: any) {
          lastError = err;
          console.error(
            `Transfer attempt ${attempt + 1} failed:`,
            err?.message || err,
          );
          try {
            console.error(
              "Full transfer error:",
              JSON.stringify(err, Object.getOwnPropertyNames(err)),
            );
          } catch (e) {
            // ignore stringify errors
          }

          // Backoff before retrying
          if (attempt < maxRetries - 1) {
            await sleep(1000 * Math.pow(2, attempt));
          }
        }
      }

      // All attempts failed - record failure and refund
      console.error("All transfer attempts failed");
      try {
        await convex.mutation(api.withdrawal.completeWithdrawal, {
          transactionId,
          status: "failed",
          error: lastError?.message
            ? `${lastError.message}`
            : "Blockchain transaction failed (no message)",
        });
      } catch (e) {
        console.error("Failed to mark withdrawal failed in DB:", e);
      }

      return NextResponse.json(
        {
          error:
            "Withdrawal failed on blockchain. Your balance has been refunded.",
          details: lastError?.message,
        },
        { status: 500 },
      );
    } catch (error: any) {
      console.error("Withdrawal API processing error:", error);
      try {
        console.error(
          "Full processing error:",
          JSON.stringify(error, Object.getOwnPropertyNames(error)),
        );
      } catch (e) {
        // ignore
      }

      // Attempt to mark withdraw failed if we have a transactionId
      try {
        if (typeof transactionId !== "undefined") {
          await convex.mutation(api.withdrawal.completeWithdrawal, {
            transactionId,
            status: "failed",
            error: error?.message || "Processing error",
          });
        }
      } catch (e) {
        console.error("Failed to mark failed after processing error:", e);
      }

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("Withdrawal API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}