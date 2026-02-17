import axios from "axios";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getAccountBalance, getNewTransactions } from "@/lib/tron/utils";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function getTrxPriceInUsdt() {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd"
    );
    return response.data.tron.usd;
  } catch (error) {
    console.error("Failed to fetch TRX price:", error);
    return 0.15;
  }
}

export async function GET(req: Request) {
  try {
    console.log("🔐 Checking authentication...");

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
        {
          error: "No deposit address found",
          message: "Please generate a deposit address first",
        },
        { status: 404 }
      );
    }

    console.log("📍 Checking deposits for address:", depositAddress);

    const checkStartedAt = Date.now();

    const trxPrice = await getTrxPriceInUsdt();
    console.log(`💱 Current TRX Price: $${trxPrice}`);

    const balance = await getAccountBalance(depositAddress);
    console.log(`💰 Wallet Balance — TRX: ${balance.trx}, USDT: ${balance.usdt}`);

    const trxAsUsdt = balance.trx * trxPrice;
    const totalWalletUsdt = balance.usdt + trxAsUsdt;
    console.log(
      `💰 Combined Balance: $${totalWalletUsdt.toFixed(4)} (TRX: ${balance.trx} → $${trxAsUsdt.toFixed(4)}, USDT: ${balance.usdt})`
    );

    const lastCheck = user.lastDepositCheck || 0;
    const alreadyCredited = user.balance || 0;

    const newTransactions = await getNewTransactions(depositAddress, lastCheck);
    console.log(
      `📊 Found ${newTransactions.length} new transactions since ${new Date(lastCheck).toISOString()}`
    );

    const deposits = [];

    for (const tx of newTransactions) {
      if (tx.to !== depositAddress) continue;

      if (!tx.confirmed) {
        console.log(`⏳ Skipping unconfirmed tx: ${tx.txHash}`);
        continue;
      }

      const txAmountUsdt =
        tx.type === "TRX"
          ? Number(tx.amount) * trxPrice
          : Number(tx.amount);

      try {
        // 1. Record the deposit entry (idempotent via hash check inside recordDeposit)
        const depositId = await convex.mutation(api.deposit.recordDeposit, {
          userId: user._id,
          network: "trc20",
          amount: txAmountUsdt,
          walletAddress: depositAddress,
          transactionHash: tx.txHash,
        });

        // 2. Mark the individual tx as completed (this does NOT touch user.balance —
        //    balance is updated in bulk below via updateUserBalance)
        await convex.mutation(api.deposit.updateDepositStatus, {
          transactionHash: tx.txHash,
          status: "completed",
        });

        deposits.push({
          id: depositId,
          txHash: tx.txHash,
          amount: txAmountUsdt,
          originalAmount: tx.amount,
          type: tx.type,
          timestamp: tx.timestamp,
        });

        console.log(
          `✅ Recorded tx entry: $${txAmountUsdt.toFixed(4)} (${tx.amount} ${tx.type}) — hash: ${tx.txHash}`
        );
      } catch (error) {
        console.error(`❌ Error recording deposit for tx ${tx.txHash}:`, error);
      }
    }

    // ── Credit the wallet balance delta to the user ───────────────────────────
    const newCreditAmount = totalWalletUsdt - alreadyCredited;

    if (newCreditAmount > 0.001) {
      console.log(
        `💳 Crediting $${newCreditAmount.toFixed(4)} USDT to user balance ` +
          `(wallet total: $${totalWalletUsdt.toFixed(4)}, already credited: $${alreadyCredited.toFixed(4)})`
      );

      // ✅ Correct mutation — directly patches user.balance with the delta
      await convex.mutation(api.user.updateUserBalance, {
        userId: user._id,
        totalCredited: totalWalletUsdt,
      });

      console.log(`✅ User balance updated — added $${newCreditAmount.toFixed(4)} USDT`);
    } else {
      console.log(
        `ℹ️ No new amount to credit (wallet: $${totalWalletUsdt.toFixed(4)}, already credited: $${alreadyCredited.toFixed(4)})`
      );
    }

    // ── Always advance lastCheck to when THIS poll started ────────────────────
    await convex.mutation(api.deposit.updateLastDepositCheck, {
      userId: user._id,
      timestamp: checkStartedAt,
    });
    console.log(`🕐 lastCheck advanced to ${new Date(checkStartedAt).toISOString()}`);

    return NextResponse.json({
      address: depositAddress,
      balance: {
        ...balance,
        trxAsUsdt,
        totalUsdt: totalWalletUsdt,
      },
      newDeposits: deposits,
      totalNewDeposits: deposits.length,
      credited: newCreditAmount > 0.001 ? newCreditAmount : 0,
    });
  } catch (error: any) {
    console.error("❌ Error checking deposits:", error);

    return NextResponse.json(
      {
        error: "Failed to check deposits",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}