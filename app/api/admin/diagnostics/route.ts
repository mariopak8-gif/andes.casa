import { NextResponse } from 'next/server';
import { getProvider, getAccountBalance } from '@/lib/arbitrum/utils';
import { ACTIVE_NETWORK, ACTIVE_USDT_CONTRACT } from '@/lib/arbitrum/config';

export async function GET() {
  try {
    const provider = await getProvider();
    const privateKey = process.env.MAIN_WALLET_PRIVATE_KEY;

    if (!privateKey) {
      return NextResponse.json({ error: 'Missing MAIN_WALLET_PRIVATE_KEY' }, { status: 500 });
    }

    // Derive hot wallet address from ethers
    const { address: hotAddress } = (await getAccountBalance('0x0000000000000000000000000000000000000000').catch(() => ({ address: '' })));
    if (!hotAddress) {
      return NextResponse.json({ error: 'Could not derive hot wallet address' }, { status: 500 });
    }
    console.log('Hot wallet address:', hotAddress);

    // Get account details via provider
    const rpcUrl = ACTIVE_NETWORK.rpcUrl;
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const accountData = await response.json();
    const account = accountData.data?.[0];

    if (!account) {
      return NextResponse.json({ error: 'Account not found on Nile' }, { status: 404 });
    }

    // Get balance
    const bal = await getAccountBalance(hotAddress);

    return NextResponse.json({
      hotWallet: {
        address: hotAddress,
        ethBalance: bal.eth,
        usdt_balance_for_configured_contract: bal.usdt,
      },
      configured: {
        ACTIVE_USDT_CONTRACT,
        TRON_PRIVATE_KEY: privateKey.substring(0, 8) + '...',
      },
      account: {
        trxBalance: (account.balance || 0) / 1_000_000,
        trc20Tokens: account.trc20 || [],
        lastOperation: account.latest_opration_time,
        createTime: account.create_time,
      },
      recommendation:
        bal.usdt === 0 && account.trc20?.length > 0
          ? `⚠️ Hot wallet has TRC20 tokens but NOT from the configured contract (${ACTIVE_USDT_CONTRACT}). Fund with USDT from the correct contract.`
          : bal.usdt > 0
          ? `✅ Hot wallet has ${bal.usdt} USDT available`
          : `❌ Hot wallet has 0 USDT. Fund it with USDT from contract ${ACTIVE_USDT_CONTRACT}`,
    });
  } catch (err: any) {
    console.error('Diagnostics error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to get diagnostics' },
      { status: 500 }
    );
  }
}
