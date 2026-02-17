import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getTronWeb, toSun, fromSun } from '@/lib/tron/utils';
import { ACTIVE_USDT_CONTRACT } from '@/lib/tron/config';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Helper to validate Tron address format
function isValidTronAddress(address: string) {
    try {
        const tronWeb = getTronWeb();
        return tronWeb.isAddress(address);
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
        const { amount, address, network } = body;

        if (!amount || !address || !network) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (network !== 'trc20') {
             return NextResponse.json({ error: "Only TRC20 withdrawals are currently supported" }, { status: 400 });
        }
        
        if (!isValidTronAddress(address)) {
             return NextResponse.json({ error: "Invalid Tron address" }, { status: 400 });
        }
        
        // 1. Get User ID from Convex
        const user = await convex.query(api.user.getUserByContact, {
             contact: session.user.contact,
        });

        if (!user) {
             return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 2. Request Withdrawal in Convex (deducts balance, creates pending tx)
        // This throws error if insufficient balance
        let transactionId;
        try {
            transactionId = await convex.mutation(api.withdrawal.requestWithdrawal, {
                userId: user._id,
                amount: parseFloat(amount),
                address: address,
                network: 'trc20',
            });
        } catch (err: any) {
             return NextResponse.json({ error: err.message || "Failed to create withdrawal request" }, { status: 400 });
        }

        // 3. Process withdrawal on Tron Blockchain
        try {
            const tronWeb = getTronWeb();
            const privateKey = process.env.TRON_PRIVATE_KEY;

            if (!privateKey) {
                throw new Error("Server configuration error: Missing hot wallet key");
            }
            
            // Set private key for signing
            tronWeb.setPrivateKey(privateKey);

            const contract = await tronWeb.contract().at(ACTIVE_USDT_CONTRACT);
            
            // Amount is in USDT (6 decimals)
            // Convert to integer units
            const amountInSun = Math.floor(parseFloat(amount) * 1_000_000);

            console.log(`Processing withdrawal: ${amount} USDT to ${address}`);
            console.log(`Contract: ${ACTIVE_USDT_CONTRACT}`);

            // Execute Transfer
            // transfer(to_address, amount)
            const tradeId = await contract.transfer(
                address, 
                amountInSun
            ).send({
                feeLimit: 100_000_000 // 100 TRX limit
            });

            console.log(`Withdrawal successful. TX ID: ${tradeId}`);

            // 4. Update transaction status to completed
            await convex.mutation(api.withdrawal.completeWithdrawal, {
                transactionId,
                status: 'completed',
                transactionHash: tradeId
            });

            return NextResponse.json({ 
                success: true, 
                txId: tradeId,
                message: "Withdrawal successful" 
            });

        } catch (error: any) {
            console.error("Blockchain withdrawal failed:", error);
            
            // 5. Refund user on failure
            await convex.mutation(api.withdrawal.completeWithdrawal, {
                transactionId,
                status: 'failed',
                error: error.message || "Blockchain transaction failed"
            });

            return NextResponse.json({ 
                error: "Withdrawal failed on blockchain. Your balance has been refunded.",
                details: error.message 
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Withdrawal API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
