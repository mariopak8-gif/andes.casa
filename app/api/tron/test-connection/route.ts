import { NextResponse } from 'next/server';
import { getTronWeb } from '@/lib/tron/utils';
import { ACTIVE_NETWORK } from '@/lib/tron/config';

export async function GET() {
  try {
    const tronWeb = getTronWeb();
    
    // Verify connection by fetching the latest block
    const block = await tronWeb.trx.getCurrentBlock();
    
    return NextResponse.json({
      success: true,
      message: "Successfully connected to Tron network",
      network: ACTIVE_NETWORK,
      latestBlock: {
        number: block.block_header.raw_data.number,
        timestamp: block.block_header.raw_data.timestamp,
        hash: block.blockID
      }
    });
  } catch (error: any) {
    console.error("Tron connectivity test failed:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to connect to Tron network",
      network: ACTIVE_NETWORK,
      error: error.message || String(error)
    }, { status: 500 });
  }
}
