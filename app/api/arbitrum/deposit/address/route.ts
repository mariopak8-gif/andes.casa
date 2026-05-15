// app/api/arbitrum/deposit/address/route.ts
// ✅ ARBITRUM ONLY — Returns or generates Arbitrum deposit address

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { generateArbitrumAddress, getAccountBalance } from '@/lib/arbitrum/utils';

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_CONVEX_URL environment variable');
  }
  return new ConvexHttpClient(url);
}

/**
 * GET — Returns (or generates) a unique Arbitrum deposit address for the logged-in user.
 *
 * Each user gets their own address. Funds sent there are swept to the hot wallet
 * automatically when they click "Check for New Deposits", and the user is credited.
 */
export async function GET(req: Request) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user?.contact) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const convex = getConvexClient();
    const user = await convex.query(api.user.getUserByContact, {
      contact: session.user.contact,
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // ── Return existing address if already generated ──────────────────────
    let depositAddress = user.depositAddresses?.arbitrum;

    if (depositAddress) {
      console.log(`[DEPOSIT ADDRESS] Returning existing address for ${session.user.contact}: ${depositAddress}`);
    } else {
      // ── Generate a fresh unique address for this user ──────────────────
      console.log(`[DEPOSIT ADDRESS] Generating new address for ${session.user.contact}...`);

      const { address, privateKey } = await generateArbitrumAddress();

      // Save both address AND private key to Convex
      // The private key is stored server-side and never returned to the client
      await convex.mutation(api.deposit.setDepositAddress, {
        userId:     user._id,
        network:    'arbitrum',
        address:    address,
        privateKey: privateKey,
      });

      depositAddress = address;
      console.log(`[DEPOSIT ADDRESS] ✅ New address generated and saved: ${address}`);
    }

    // ── Get current balance on the deposit address ────────────────────────
    let balance = { eth: 0, usdt: 0 };
    try {
      balance = await getAccountBalance(depositAddress);
    } catch (e: any) {
      console.warn(`[DEPOSIT ADDRESS] Could not fetch balance: ${e?.message}`);
    }

    return NextResponse.json({
      success:        true,
      depositAddress,
      depositNetwork: 'arbitrum',
      network:        'Arbitrum (L2)',
      minDeposit:     20,
      userBalance:    (user.depositAmount ?? 0) + (user.earnings ?? 0),
      addressBalance: {
        eth:  balance.eth,
        usdt: balance.usdt,
      },
      instructions: [
        `Send USDT to: ${depositAddress}`,
        'Minimum deposit: 20 USDT',
        'Network: Arbitrum One (L2) — do NOT send from other networks',
        'Click "Check for New Deposits" after sending to credit your account',
      ],
    });
  } catch (error: any) {
    console.error('[DEPOSIT ADDRESS] Error:', error?.message ?? error);
    return NextResponse.json(
      { error: error?.message ?? 'Failed to get deposit address' },
      { status: 500 }
    );
  }
}
