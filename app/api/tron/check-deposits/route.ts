// api/tron/check-deposits/route.ts

import axios from "axios";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getAccountBalance, getNewTransactions } from "@/lib/tron/utils";
import { sendTrx, sweepUsdtFromAddress } from "../../../../server/tronService";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const MIN_USDT_TO_SWEEP = 1;
const FALLBACK_TRX_PRICE = 0.15;

async function getTrxPriceInUsdt(): Promise<number> {
  try {
    const res = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd"
    );
    return res.data.tron.usd;
  } catch {
    return FALLBACK_TRX_PRICE;
  }
}

/**
 * Activate new address if needed, then sweep USDT using rented energy only (no TRX gas funding)
 */
async function energyFirstSweep(
  depositAddress: string,
  hotWalletAddress: string,
  depositPrivateKey: string,
  currentTrxBalance: number,
  usdtBalance: number
): Promise<{ txId: string; amount: number } | null> {
  if (usdtBalance < MIN_USDT_TO_SWEEP) {
    console.log(`⏭️ [SWEEP] Balance too small (${usdtBalance}) — skipping`);
    return null;
  }

  // STEP 1: Only activate if address is truly new (no USDT and no TRX)
  // If USDT exists, address is already activated
  let activationFailed = false;
  if (usdtBalance === 0 && currentTrxBalance < 0.1) {
    console.log(`🟡 [ACTIVATE] New address detected. Sending 1 TRX to activate...`);
    try {
      const txId = await sendTrx(depositAddress, 1);
      console.log(`✅ [ACTIVATE] Address activated: ${txId}`);
      await new Promise(r => setTimeout(r, 5000));
    } catch (err: any) {
      console.warn(`⚠️ [ACTIVATE WARNING] Activation failed (hot wallet may lack TRX): ${err?.message}`);
      console.warn(`⚠️ [ACTIVATE] Attempting sweep anyway with available energy...`);
      activationFailed = true;
    }
  } else if (usdtBalance > 0) {
    console.log(`✅ [ACTIVATED] Address already active (has ${usdtBalance} USDT) — sweeping...`);
  } else {
    console.log(`⚡ [ENERGY] Address has low TRX — using rented energy for sweep`);
  }

  // STEP 2: Sweep USDT using rented energy only (no TRX gas funding)
  try {
    console.log(`🔁 [SWEEP] Sweeping ${usdtBalance} USDT → ${hotWalletAddress}${activationFailed ? ' (no activation)' : ''}`);
    const sweepRes = await sweepUsdtFromAddress(
      depositAddress,
      hotWalletAddress,
      depositPrivateKey
    );

    if (!sweepRes?.txId) throw new Error("No txId returned from sweep");

    console.log(`✅ [SWEEP] Swept ${sweepRes.amount} USDT → ${hotWalletAddress}`);
    return sweepRes;
  } catch (err: any) {
    if (activationFailed) {
      console.error(`❌ [SWEEP FAILED] Activation was required but failed. Hot wallet TRX status:`);
      console.error(`   → To fix: Fund hot wallet (${hotWalletAddress}) with TRX`);
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
  amount: number;
  sweptToHotWallet: boolean;
}): Promise<string | null> {
  try {
    const depositId = await convex.mutation(api.deposit.recordDeposit, {
      userId: params.userId as Id<"user">,
      network: "trc20",
      amount: params.amount,
      walletAddress: params.depositAddress,
      transactionHash: params.txHash,
    });

    await convex.mutation(api.deposit.updateDepositStatus, {
      transactionHash: params.txHash,
      status: "completed",
    });

    console.log(
      `✅ [DB] $${params.amount.toFixed(4)} USDT | hash: ${params.txHash} | swept: ${params.sweptToHotWallet}`
    );
    return depositId;
  } catch (e: any) {
    console.error(`❌ [DB] Failed to record ${params.txHash}: ${e?.message}`);
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

    const depositAddress = user.depositAddresses?.trc20;
    if (!depositAddress) {
      return NextResponse.json(
        { error: "No deposit address found. Visit the Deposit page first." },
        { status: 404 }
      );
    }

    const depositPrivateKey = user.depositPrivateKeys?.trc20;
    const hotWalletAddress = process.env.MAIN_WALLET_ADDRESS;
    const canSweep = !!(depositPrivateKey && hotWalletAddress);

    // Check hot wallet TRX balance for activation capacity
    let hotWalletHasActivationTrx = false;
    if (hotWalletAddress) {
      try {
        const hotWalletBalance = await getAccountBalance(hotWalletAddress);
        hotWalletHasActivationTrx = hotWalletBalance.trx >= 1;
        if (!hotWalletHasActivationTrx) {
          console.warn(`⚠️ [HOT WALLET] Insufficient TRX for activation: ${hotWalletBalance.trx} TRX`);
        }
      } catch (e) {
        console.warn(`⚠️ [HOT WALLET] Could not check balance: ${e}`);
      }
    }

    console.log(`\n${"─".repeat(60)}`);
    console.log(`👤 User:           ${session.user.contact}`);
    console.log(`📥 Deposit addr:   ${depositAddress}`);
    console.log(`🔥 Hot wallet:     ${hotWalletAddress ?? "NOT SET"}`);
    console.log(`💰 Activation TRX: ${hotWalletHasActivationTrx ? "✅ READY" : "❌ INSUFFICIENT"}`);
    console.log(`🔑 Has priv key:   ${!!depositPrivateKey}`);
    console.log(`🔑 Can sweep:      ${canSweep}`);
    console.log(`${"─".repeat(60)}\n`);

    const checkStartedAt = Date.now();
    const lastCheck = user.lastDepositCheck ?? 0;
    const alreadyCredited = user.depositAmount ?? 0;

    const [trxPrice, balance, newTransactions] = await Promise.all([
      getTrxPriceInUsdt(),
      getAccountBalance(depositAddress),
      getNewTransactions(depositAddress, lastCheck),
    ]);

    const trxAsUsdt = balance.trx * trxPrice;
    const totalWalletUsdt = balance.usdt + trxAsUsdt;

    console.log(`💱 TRX price:  $${trxPrice}`);
    console.log(
      `💰 Balance:    TRX ${balance.trx} ($${trxAsUsdt.toFixed(4)}) | USDT ${balance.usdt}`
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

      const txAmountUsdt =
        tx?.type === "TRX" ? Number(tx?.amount) * trxPrice : Number(tx?.amount);

      console.log(
        `\n🆕 Deposit: ${tx?.amount} ${tx?.type} = $${txAmountUsdt.toFixed(4)} | ${tx?.txHash}`
      );

      let recordedTxHash = tx?.txHash;
      let recordedAmount = txAmountUsdt;
      let sweptToHotWallet = false;

      if (tx?.type === "TRC20" && canSweep) {
        const sweepResult = await energyFirstSweep(
          depositAddress,
          hotWalletAddress!,
          depositPrivateKey!,
          balance.trx,
          balance.usdt
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
        balance.trx,
        balance.usdt
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
    } else {
      console.log(`\nℹ️ No new deposits`);
    }

    await convex.mutation(api.deposit.updateLastDepositCheck, {
      userId: user._id,
      timestamp: checkStartedAt,
    });
    console.log(`🕐 lastCheck → ${new Date(checkStartedAt).toISOString()}\n`);

    return NextResponse.json({
      address: depositAddress,
      balance: { ...balance, trxAsUsdt, totalUsdt: totalWalletUsdt },
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