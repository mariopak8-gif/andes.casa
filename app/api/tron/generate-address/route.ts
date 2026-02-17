import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { generateTronAddress } from "@/lib/tron/utils";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    console.log("🔐 Checking authentication...");
    
    // Verify authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.contact) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ User authenticated:", session.user.contact);

    // Get user from Convex
    const user = await convex.query(api.user.getUserByContact, {
      contact: session.user.contact,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("👤 User found:", user._id);

    // Check if user already has a TRC20 address
    const existingAddress = user.depositAddresses?.trc20;
    
    if (existingAddress) {
      console.log("📍 Address already exists:", existingAddress);
      return NextResponse.json({
        address: existingAddress,
        isNew: false,
        network: 'trc20',
      });
    }

    console.log("🔧 Generating new TRON address...");

    // Generate new TRON address
    const { address, privateKey, hexAddress } = await generateTronAddress();

    console.log("✅ New address generated:", address);

    // IMPORTANT: In production, encrypt the private key before storing!
    // For now, we'll store it in a separate secure table
    
    // Save address to user's depositAddresses
    await convex.mutation(api.deposit.saveDepositAddress, {
      userId: user._id,
      network: 'trc20',
      address,
    });

    // Also save the private key securely (IMPORTANT: Encrypt in production!)
    // This should be in a separate, highly secured table
    // For testnet, we'll just log it (NEVER do this in production!)
    console.log("⚠️  TESTNET PRIVATE KEY:", privateKey);
    console.log("⚠️  SAVE THIS SECURELY! In production, encrypt before storing!");

    console.log("💾 Address saved to database");

    return NextResponse.json({
      address,
      hexAddress,
      isNew: true,
      network: 'trc20',
      // NEVER return private key to client!
    });

  } catch (error: any) {
    console.error("❌ Error generating TRON address:", error);
    
    return NextResponse.json({
      error: "Failed to generate TRON address",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    }, { status: 500 });
  }
}