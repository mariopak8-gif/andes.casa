#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import readline from "readline";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ Missing NEXT_PUBLIC_CONVEX_URL environment variable");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  try {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║         🔄 Reset Deposit Check Timestamp                  ║
║  (This allows the system to re-scan for your deposits)    ║
╚════════════════════════════════════════════════════════════╝
`);

    const contact = await question("📧 Enter your contact (phone/email): ");

    if (!contact || contact.trim().length === 0) {
      console.log("❌ Contact is required");
      process.exit(1);
    }

    console.log(`\n🔍 Looking up user: ${contact}...`);

    // Query for user
    const user = await convex.query(api.user.getUserByContact, {
      contact: contact.trim(),
    });

    if (!user) {
      console.log(`❌ User not found: ${contact}`);
      console.log(`\nℹ️  Make sure to enter the exact contact (phone or email) you used to register.`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.fullname || user.contact}`);
    console.log(`   Current lastDepositCheck: ${user.lastDepositCheck ? new Date(user.lastDepositCheck).toISOString() : "Never"}`);

    const confirm = await question("\n⚠️  Reset this user's deposit check timestamp to 0? (yes/no): ");

    if (confirm.toLowerCase() !== "yes") {
      console.log("Cancelled.");
      process.exit(0);
    }

    console.log(`\n⏳ Resetting timestamp...`);

    await convex.mutation(api.deposit.updateLastDepositCheck, {
      userId: user._id,
      timestamp: 0,
    });

    console.log(`✅ Successfully reset lastDepositCheck to 0`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Go to your Deposit page in the app`);
    console.log(`   2. Click "Check for New Deposits" button`);
    console.log(`   3. Your deposit should now be detected!\n`);

  } catch (error) {
    console.error("❌ Error:", error.message || error);
    console.error(error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
