// app/api/arbitrum/poll-deposits/route.ts
// ✅ ARBITRUM ONLY — Cron job to check ALL users' deposits automatically

import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { getAccountBalance, getNewTransactions } from '@/lib/arbitrum/utils';
import { ETH_GAS_TOPUP_USD, MIN_DEPOSIT } from '@/lib/arbitrum/config';
import { sendEth, sweepUsdtFromAddress } from '../../../../server/arbitrumService';
import { Id } from '@/convex/_generated/dataModel';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const MIN_USDT_TO_SWEEP = 0.5;
const FALLBACK_ETH_PRICE = 2500;

async function getEthPriceInUsdt(): Promise<number> {
  try {
    const axios = (await import('axios')).default;
    const res = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
    );
    return res.data.ethereum.usd;
  } catch {
    return FALLBACK_ETH_PRICE;
  }
}

/**
 * Sweep USDT with optional ETH gas funding if needed
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
  }

  // STEP 2: Sweep USDT
  try {
    console.log(`🔁 [SWEEP] Sweeping ${usdtBalance} USDT → ${hotWalletAddress}${gasFailure ? ' (no gas pre-funded)' : ''}`);
    const sweepRes = await sweepUsdtFromAddress(
      depositAddress,
      hotWalletAddress,
      depositPrivateKey
    );

    if (!sweepRes?.txId) throw new Error('No txId returned from sweep');

    console.log(`✅ [SWEEP] Swept ${sweepRes.amount} USDT → ${hotWalletAddress}`);
    return sweepRes;
  } catch (err: any) {
    if (gasFailure) {
      console.error(`❌ [SWEEP FAILED] Gas funding was required but failed. Hot wallet ETH status:`);
      console.error(`   → To fix: Fund hot wallet (${hotWalletAddress}) with ETH`);
    } else {
      console.error('❌ [SWEEP ERROR]:', err?.message ?? err);
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
      userId: params.userId as Id<'user'>,
      network: 'arbitrum',
      amount: params.amount,
      walletAddress: params.depositAddress,
      transactionHash: params.txHash,
    });

    await convex.mutation(api.deposit.updateDepositStatus, {
      transactionHash: params.txHash,
      status: 'completed',
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

export async function POST(req: Request) {
  try {
    // ── Verify cron authentication ──────────────────────────────────────
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || process.env.POLLING_SECRET;

    if (!cronSecret) {
      console.error('❌ [CRON] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 }
      );
    }

    if (!authHeader?.includes(cronSecret)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`🔄 [POLL DEPOSITS] Starting automated Arbitrum deposit check`);
    console.log(`${'═'.repeat(70)}\n`);

    const startTime = Date.now();

    // Get hot wallet configuration
    const hotWalletAddress = process.env.MAIN_WALLET_ADDRESS;
    if (!hotWalletAddress) {
      return NextResponse.json(
        { error: 'MAIN_WALLET_ADDRESS not configured' },
        { status: 500 }
      );
    }

    // Check hot wallet ETH balance for gas
    let hotWalletHasEnoughEth = false;
    try {
      const hotWalletBalance = await getAccountBalance(hotWalletAddress);
      hotWalletHasEnoughEth = hotWalletBalance.eth >= 0.01; // Need buffer for multiple sweeps
      console.log(`🔥 [HOT WALLET] ETH Balance: ${hotWalletBalance.eth} ETH | Ready: ${hotWalletHasEnoughEth ? '✅' : '⚠️'}`);
    } catch (e: any) {
      console.warn(`⚠️ [HOT WALLET] Could not check balance: ${e?.message}`);
    }

    // ── Fetch all users with Arbitrum addresses ─────────────────────
    const usersWithArbitrumAddresses = await convex.query(api.user.getAllUsers);
    const activeUsers = usersWithArbitrumAddresses
      .filter((u: any) => u.depositAddresses?.arbitrum && u.depositPrivateKeys?.arbitrum)
      .slice(0, 100); // Limit to prevent timeout

    console.log(`👥 [POLL] Found ${activeUsers.length} users with Arbitrum addresses`);

    if (activeUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users with Arbitrum addresses to check',
        duration: Date.now() - startTime,
      });
    }

    const ethPrice = await getEthPriceInUsdt();
    console.log(`💱 [PRICE] ETH: $${ethPrice.toFixed(2)}\n`);

    let totalDepositsProcessed = 0;
    let totalAmountSwept = 0;
    const results = [];

    // ── Check each user's deposit address ────────────────────────────
    for (const user of activeUsers) {
      const depositAddress = user.depositAddresses?.arbitrum;
      const depositPrivateKey = user.depositPrivateKeys?.arbitrum;
      const lastCheck = user.lastDepositCheck ?? 0;
      const userId = user._id;

      if (!depositAddress || !depositPrivateKey) continue;

      try {
        console.log(`\n📍 [USER] ${user.contact || user.email}`);
        console.log(`   Deposit: ${depositAddress.substring(0, 10)}...`);

        // Get balance and transactions
        const [balance, newTransactions] = await Promise.all([
          getAccountBalance(depositAddress),
          getNewTransactions(depositAddress, lastCheck),
        ]);

        console.log(`   Balance: ${balance.usdt} USDT | ${balance.eth} ETH`);
        console.log(`   New TXs: ${newTransactions.length}`);

        let userTotalDeposits = 0;

        // Process each transaction
        for (const tx of newTransactions) {
          if (tx.to.toLowerCase() !== depositAddress.toLowerCase()) continue;
          if (!tx.confirmed) {
            console.log(`   ⏳ Unconfirmed: ${tx.txHash}`);
            continue;
          }
          if (tx.from.toLowerCase() === hotWalletAddress.toLowerCase()) {
            console.log(`   ⏭️ Own funding tx: ${tx.txHash}`);
            continue;
          }

          // Check minimum deposit amount
          const minDeposit = MIN_DEPOSIT.USDT;
          if (tx.amount < minDeposit) {
            console.log(`   ⚠️  Too small: ${tx.amount} USDT (min ${minDeposit} USDT)`);
            continue;
          }

          console.log(`   🆕 Deposit: ${tx.amount} USDT | ${tx.txHash}`);

          let recordedTxHash = tx.txHash;
          let recordedAmount = tx.amount;
          let sweptToHotWallet = false;

          // Attempt sweep
          if (hotWalletHasEnoughEth) {
            const sweepResult = await energyFirstSweep(
              depositAddress,
              hotWalletAddress,
              depositPrivateKey,
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

          // Record in database
          const depositId = await recordAndConfirmDeposit({
            userId: userId,
            depositAddress,
            txHash: recordedTxHash,
            amount: recordedAmount,
            sweptToHotWallet,
          });

          if (depositId) {
            userTotalDeposits += recordedAmount;
            totalDepositsProcessed += 1;
            totalAmountSwept += recordedAmount;
          }
        }

        // Fallback sweep for accumulated USDT
        if (newTransactions.length === 0 && balance.usdt >= MIN_USDT_TO_SWEEP && hotWalletHasEnoughEth) {
          console.log(`   🔍 [FALLBACK] ${balance.usdt} USDT on address — attempting sweep`);

          const sweepResult = await energyFirstSweep(
            depositAddress,
            hotWalletAddress,
            depositPrivateKey,
            balance.eth,
            balance.usdt,
            ethPrice
          );

          if (sweepResult) {
            const depositId = await recordAndConfirmDeposit({
              userId: userId,
              depositAddress,
              txHash: sweepResult.txId,
              amount: sweepResult.amount,
              sweptToHotWallet: true,
            });

            if (depositId) {
              userTotalDeposits += sweepResult.amount;
              totalDepositsProcessed += 1;
              totalAmountSwept += sweepResult.amount;
            }
          }
        }

        // ✅ ONLY update lastCheck if deposits were found
        // This prevents blocking future deposits if they arrive after a check with no results
        if (userTotalDeposits > 0) {
          await convex.mutation(api.deposit.updateLastDepositCheck, {
            userId: userId,
            timestamp: startTime,
          });
          console.log(`   💳 Credited: $${userTotalDeposits.toFixed(4)}`);
          results.push({
            user: user.contact || user.email,
            depositsFound: userTotalDeposits,
          });
        } else {
          console.log(`   ℹ️ No deposits found — lastCheck unchanged`);
        }
      } catch (e: any) {
        console.error(`   ❌ Error processing user: ${e?.message}`);
        results.push({
          user: user.contact || user.email,
          error: e?.message,
        });
      }
    }

    const duration = Date.now() - startTime;

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`✅ [POLL COMPLETE]`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Deposits: ${totalDepositsProcessed}`);
    console.log(`   Amount: $${totalAmountSwept.toFixed(4)} USDT`);
    console.log(`   Hot Wallet ETH: ${hotWalletHasEnoughEth ? '✅ Ready' : '⚠️ Low'}`);
    console.log(`${'═'.repeat(70)}\n`);

    return NextResponse.json({
      success: true,
      duration,
      usersChecked: activeUsers.length,
      totalDepositsProcessed,
      totalAmountSwept,
      results,
    });
  } catch (error: any) {
    console.error('❌ Poll deposits failed:', error?.message);
    return NextResponse.json(
      {
        error: 'Failed to poll deposits',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
