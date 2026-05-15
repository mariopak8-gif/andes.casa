// app/api/arbitrum/check-deposits/route.ts
// ✅ ARBITRUM ONLY — TRC20/TRON removed

import axios from "axios";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getAccountBalance, getNewTransactions } from "@/lib/arbitrum/utils";
import { ETH_GAS_TOPUP_USD } from '@/lib/arbitrum/config';
import { sendEth, sweepUsdtFromAddress } from "../../../../server/arbitrumService";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const MIN_USDT_TO_SWEEP = 0.5; // Arbitrum: small amounts to sweep
const FALLBACK_ETH_PRICE = 2500; // Approximate USD price

async function getEthPriceInUsdt(): Promise<number> {
  try {
    const res = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
    );
    return res.data.ethereum.usd;
  } catch {
    return FALLBACK_ETH_PRICE;
  }
}

/**
 * Sweep USDT with optional ETH gas funding if needed (Arbitrum)
 */
async function energyFirstSweep(
  depositAddress: string,
  hotWalletAddress: string,
  depositPrivateKey: string,
  currentEthBalance: number,
  usdtBalance: number,
  ethPrice: number
): Promise<{ txId: string; amount: number } | null> {
  if (usdtBalance < MIN_USDT_TO_SWEEP) {
    console.log(`⏭️ [SWEEP] Balance too small (${usdtBalance}) — skipping`);
    return null;
  }

  // STEP 1: Fund ETH only when the deposit address has less than the configured USD gas buffer
  let gasFailure = false;
  const ethValueInUsd = currentEthBalance * ethPrice;
  if (usdtBalance > 0 && ethValueInUsd < ETH_GAS_TOPUP_USD) {
    const amountToSend = ETH_GAS_TOPUP_USD / ethPrice; // Send configured USD amount of ETH
    console.log(
      `🟡 [GAS] Deposit address ETH value ($${ethValueInUsd.toFixed(4)}) < $${ETH_GAS_TOPUP_USD.toFixed(2)}. Funding ${amountToSend.toFixed(6)} ETH ($${ETH_GAS_TOPUP_USD.toFixed(2)}) for gas...`
    );
    try {
      const txId = await sendEth(depositAddress, amountToSend);
      console.log(`✅ [GAS] Address funded: ${txId}`);
      await new Promise(r => setTimeout(r, 5000));
    } catch (err: any) {
      console.warn(`⚠️ [GAS WARNING] Gas funding failed (hot wallet may lack ETH): ${err?.message}`);
      console.warn(`⚠️ [GAS] Attempting sweep anyway...`);
      gasFailure = true;
    }
  } else if (usdtBalance > 0) {
    console.log(`✅ [READY] Deposit address has sufficient ETH value ($${ethValueInUsd.toFixed(4)}) — skipping extra gas funding.`);
  } else {
    console.log(`⚡ [SWEEP] Address has low ETH balance — will attempt to fund`);
  }

  // STEP 2: Sweep USDT 
  try {
    console.log(`🔁 [SWEEP] Sweeping ${usdtBalance} USDT → ${hotWalletAddress}${gasFailure ? ' (no gas pre-funded)' : ''}`);
    const sweepRes = await sweepUsdtFromAddress(
      depositAddress,
      hotWalletAddress,
      depositPrivateKey
    );

    if (!sweepRes?.txId) throw new Error("No txId returned from sweep");

    console.log(`✅ [SWEEP] Swept ${sweepRes.amount} USDT → ${hotWalletAddress}`);
    return sweepRes;
  } catch (err: any) {
    if (gasFailure) {
      console.error(`❌ [SWEEP FAILED] Gas funding was required but failed. Hot wallet ETH status:`);
      console.error(`   → To fix: Fund hot wallet (${hotWalletAddress}) with ETH`);
    } else {
      console.error("❌ [SWEEP ERROR]:", err?.message ?? err);
    }
    return null;
  }
}

async function recordAndConfirmDeposit(params: {
  userId: string;
  depositAddress: string;
  txHash: string;
  originalTxHash?: string;
  amount: number;
  sweptToHotWallet: boolean;
}): Promise<string | null> {
  try {
    const transactionHash = params.originalTxHash || params.txHash;

    const depositId = await convex.mutation(api.deposit.recordDeposit, {
      userId: params.userId as Id<"user">,
      network: "arbitrum",
      amount: params.amount,
      walletAddress: params.depositAddress,
      transactionHash,
    });

    await convex.mutation(api.deposit.updateDepositStatus, {
      transactionHash,
      status: "completed",
    });

    console.log(
      `✅ [DB] $${params.amount.toFixed(4)} USDT | hash: ${transactionHash} | swept: ${params.sweptToHotWallet}`
    );
    if (params.sweptToHotWallet && params.originalTxHash) {
      console.log(`   Original deposit tx: ${params.originalTxHash}`);
      console.log(`   Sweep tx id: ${params.txHash}`);
    }
    return depositId;
  } catch (e: any) {
    console.error(`❌ [DB] Failed to record ${params.originalTxHash || params.txHash}: ${e?.message}`);
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.contact) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await convex.query(api.user.getUserByContact, {
      contact: session.user.contact,
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Use Arbitrum deposit address
    const depositAddress = user.depositAddresses?.arbitrum;
    if (!depositAddress) {
      return NextResponse.json(
        { error: "No Arbitrum deposit address found. Visit the Deposit page first." },
        { status: 404 }
      );
    }

    const depositPrivateKey = user.depositPrivateKeys?.arbitrum;
    const hotWalletAddress = process.env.MAIN_WALLET_ADDRESS;
    const canSweep = !!(depositPrivateKey && hotWalletAddress);

    // Check hot wallet ETH balance for gas
    let hotWalletHasEnoughEth = false;
    if (hotWalletAddress) {
      try {
        const hotWalletBalance = await getAccountBalance(hotWalletAddress);
        hotWalletHasEnoughEth = hotWalletBalance.eth >= 0.001;
        if (!hotWalletHasEnoughEth) {
          console.warn(`⚠️ [HOT WALLET] Insufficient ETH for gas: ${hotWalletBalance.eth} ETH`);
        }
      } catch (e) {
        console.warn(`⚠️ [HOT WALLET] Could not check balance: ${e}`);
      }
    }

    console.log(`\n${"─".repeat(60)}`);
    console.log(`👤 User:           ${session.user.contact}`);
    console.log(`📥 Deposit addr:   ${depositAddress}`);
    console.log(`🔥 Hot wallet:     ${hotWalletAddress ?? "NOT SET"}`);
    console.log(`💰 Gas ETH:        ${hotWalletHasEnoughEth ? "✅ READY" : "❌ INSUFFICIENT"}`);
    console.log(`🔑 Has priv key:   ${!!depositPrivateKey}`);
    console.log(`🔑 Can sweep:      ${canSweep}`);
    console.log(`${"─".repeat(60)}\n`);

    const checkStartedAt = Date.now();
    const lastCheck = user.lastDepositCheck ?? 0;
    const alreadyCredited = user.depositAmount ?? 0;

    const [ethPrice, balance, newTransactions] = await Promise.all([
      getEthPriceInUsdt(),
      getAccountBalance(depositAddress),
      getNewTransactions(depositAddress, lastCheck),
    ]);

    const ethAsUsdt = balance.eth * ethPrice;
    const totalWalletUsdt = balance.usdt + ethAsUsdt;

    console.log(`💱 ETH price:  $${ethPrice}`);
    console.log(
      `💰 Balance:    ETH ${balance.eth} ($${ethAsUsdt.toFixed(4)}) | USDT ${balance.usdt}`
    );
    console.log(`📊 New txs:    ${newTransactions.length}`);

    const deposits: any[] = [];
    let totalNewDepositAmount = 0;

    for (const tx of newTransactions) {
      if ((tx?.to ?? "").toLowerCase() !== depositAddress.toLowerCase()) continue;
      if (!tx?.confirmed) {
        console.log(`⏳ Unconfirmed: ${tx?.txHash}`);
        continue;
      }
      if (hotWalletAddress && tx?.from === hotWalletAddress) {
        console.log(`⏭️ Own funding tx: ${tx?.txHash}`);
        continue;
      }

      const txAmountUsdt = Number(tx?.amount); // Arbitrum: track USDT deposits

      console.log(
        `\n🆕 Deposit: ${tx?.amount} USDT = $${txAmountUsdt.toFixed(4)} | ${tx?.txHash}`
      );

      let recordedTxHash = tx?.txHash;
      let recordedAmount = txAmountUsdt;
      let sweptToHotWallet = false;

      if (canSweep) {
        const sweepResult = await energyFirstSweep(
          depositAddress,
          hotWalletAddress!,
          depositPrivateKey!,
          balance.eth,
          balance.usdt,
          ethPrice
        );

        if (sweepResult) {
          recordedTxHash = sweepResult.txId;
          recordedAmount = sweepResult.amount;
          sweptToHotWallet = true;
        }
      }

      const depositId = await recordAndConfirmDeposit({
        userId: user._id,
        depositAddress,
        txHash: recordedTxHash,
        originalTxHash: sweptToHotWallet ? tx?.txHash : undefined,
        amount: recordedAmount,
        sweptToHotWallet,
      });

      if (depositId) {
        deposits.push({
          id: depositId,
          txHash: recordedTxHash,
          originalTxHash: sweptToHotWallet ? tx?.txHash : undefined,
          amount: recordedAmount,
          originalAmount: tx?.amount,
          type: tx?.type,
          timestamp: tx?.timestamp,
          sweptToHotWallet,
        });
        totalNewDepositAmount += recordedAmount;
      }
    }

    // Fallback sweep — USDT on-chain but no new txs detected
    if (deposits.length === 0 && balance.usdt >= MIN_USDT_TO_SWEEP && canSweep) {
      console.log(
        `\n🔍 [FALLBACK] ${balance.usdt} USDT sitting on address — attempting sweep`
      );

      const sweepResult = await energyFirstSweep(
        depositAddress,
        hotWalletAddress!,
        depositPrivateKey!,
        balance.eth,
        balance.usdt,
        ethPrice
      );

      if (sweepResult) {
        const depositId = await recordAndConfirmDeposit({
          userId: user._id,
          depositAddress,
          txHash: sweepResult.txId,
          amount: sweepResult.amount,
          sweptToHotWallet: true,
        });

        if (depositId) {
          deposits.push({
            id: depositId,
            txHash: sweepResult.txId,
            amount: sweepResult.amount,
            sweptToHotWallet: true,
            source: "fallback-sweep",
          });
          totalNewDepositAmount += sweepResult.amount;
        }
      }
    }

    if (totalNewDepositAmount > 0.001) {
      const newTotal = alreadyCredited + totalNewDepositAmount;
      await convex.mutation(api.user.updateUserBalance, {
        userId: user._id,
        depositAmount: newTotal,
      });
      console.log(
        `\n💳 Credited $${totalNewDepositAmount.toFixed(4)} — new total: $${newTotal.toFixed(4)}`
      );
      
      // ✅ ONLY update lastCheck when deposits are found and credited
      // This prevents blocking future deposits if they arrive after a check with no results
      await convex.mutation(api.deposit.updateLastDepositCheck, {
        userId: user._id,
        timestamp: checkStartedAt,
      });
      console.log(`🕐 lastCheck → ${new Date(checkStartedAt).toISOString()}\n`);
    } else {
      console.log(`\nℹ️ No new deposits`);
      // ⚠️ Do NOT update lastCheck — keep it as-is so future deposits aren't filtered out
      console.log(`🕐 lastCheck unchanged — staying at ${new Date(lastCheck).toISOString()}\n`);
    }

    return NextResponse.json({
      address: depositAddress,
      balance: { ...balance, ethAsUsdt, totalUsdt: totalWalletUsdt },
      newDeposits: deposits,
      totalNewDeposits: deposits.length,
      credited: totalNewDepositAmount > 0.001 ? totalNewDepositAmount : 0,
    });
  } catch (error: any) {
    console.error("❌ Deposit check failed:", error?.message);
    return NextResponse.json(
      {
        error: "Failed to check deposits",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
