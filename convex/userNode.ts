"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { ethers } from "ethers";

const TRONGRID_API_KEY = process.env.TRONGRID_API_KEY || "34bc99af-0435-44d7-ae2c-463be7256be5";
const TRONGRID_API_URL = process.env.TRONGRID_API_URL || "https://api.trongrid.io";

// Helper function to generate real TRC20 address using TronGrid API
async function generateTRC20Address(userId: string): Promise<string> {
  try {
    // Create a deterministic wallet from userId
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    const seed = hash.update(userId + ':trc20:seed').digest();
    
    // Use ethers to create a wallet, then use that to generate Tron address
    // Tron addresses are derived differently - we'll use a Tron library approach
    // TronWeb expects the private key as a hex string WITHOUT the 0x prefix
    const privateKey = seed.toString('hex');
    
    // For now, use a deterministic approach with TronWeb
    // Create address based on the private key
    const TronWeb = require('tronweb');
    const tronWeb = new TronWeb({
      fullHost: TRONGRID_API_URL,
      headers: { "TRON-PRO-API-KEY": TRONGRID_API_KEY }
    });
    
    // Generate account from private key
    const account = tronWeb.address.fromPrivateKey(privateKey);
    return account;
  } catch (error) {
    console.error("Failed to generate TRC20 address via TronGrid:", error);
    // Fallback: generate deterministic address
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    const hexHash = hash.update(userId + ':trc20:fallback').digest('hex');
    return 'T' + hexHash.substring(0, 33).toUpperCase();
  }
}

// Helper function to generate real blockchain addresses based on network
async function generateAddressForNetwork(userId: string, network: string): Promise<string> {
  try {
    if (network === 'trc20') {
      return await generateTRC20Address(userId);
    }
    
    // For ERC20, BEP20, and Polygon - use ethers.js
    const { randomBytes } = require("crypto");
    const pk = "0x" + randomBytes(32).toString("hex");
    const wallet = new ethers.Wallet(pk);
    console.log("Private Key:", pk);
    console.log("Address:", wallet.address);
    return wallet.address;
  } catch (error) {
    console.error(`Failed to generate address for ${network}:`, error);
    // Fallback to hash-based method
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    const hexHash = hash.update(userId + ':' + network + ':fallback').digest('hex');
    
    if (network === 'trc20') {
      return 'T' + hexHash.substring(0, 33).toUpperCase();
    } else {
      return '0x' + hexHash.substring(0, 40);
    }
  }
}

export const generateUserAddresses = action({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const networks = ['trc20', 'bep20', 'erc20', 'polygon'];
    const addresses: any = {};

    for (const network of networks) {
      addresses[network] = await generateAddressForNetwork(args.userId, network);
    }

    return addresses;
  },
});
