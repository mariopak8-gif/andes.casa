// app/api/withdrawal/request/route.ts
// Create a withdrawal request for non-TRC20 networks

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  // Withdrawals are now only supported on Arbitrum (ERC20).
  // The old endpoint for tron/bep20/polygon is deprecated.
  return NextResponse.json(
    { error: 'Deprecated: use /api/arbitrum/withdraw for ERC20 withdrawals only' },
    { status: 400 }
  );
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/withdrawal/request',
    method: 'POST',
    description: 'Deprecated endpoint. Use /api/arbitrum/withdraw instead; only ERC20 supported.',
  });
}
