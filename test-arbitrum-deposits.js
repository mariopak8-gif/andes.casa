#!/usr/bin/env node

/**
 * Test Arbitrum Deposit Detection
 * Tests if the updated USDT contract detects the deposit
 */

import { getNewTransactions } from './lib/arbitrum/utils.js';

const DEPOSIT_ADDRESS = '0x55D518D1E96bCdad99f12516944e8d0D6bB3a58e';

async function testDepositDetection() {
  console.log('🧪 Testing Arbitrum deposit detection...');
  console.log(`📧 Deposit Address: ${DEPOSIT_ADDRESS}`);

  try {
    // Check for new transactions (set lastCheckTimestamp to 0 to get all recent)
    const transactions = await getNewTransactions(DEPOSIT_ADDRESS, 0);

    console.log(`\n📊 Found ${transactions.length} transactions:`);

    if (transactions.length === 0) {
      console.log('❌ No transactions found');
      return;
    }

    transactions.forEach((tx, index) => {
      console.log(`\n--- Transaction ${index + 1} ---`);
      console.log(`Hash: ${tx.hash}`);
      console.log(`From: ${tx.from}`);
      console.log(`To: ${tx.to}`);
      console.log(`Amount: ${tx.amount} ${tx.symbol}`);
      console.log(`Timestamp: ${new Date(tx.timestamp * 1000).toISOString()}`);
      console.log(`Block: ${tx.blockNumber}`);
    });

    // Check if our specific transaction is detected
    const targetTx = transactions.find(tx =>
      tx.hash.toLowerCase() === '0xb8ed54bb038c1b59df1ffdaa6f7cae5f206b49ec99731dbf776676ab539642a0'.toLowerCase()
    );

    if (targetTx) {
      console.log('\n✅ SUCCESS: The deposit transaction was detected!');
      console.log(`Amount: ${targetTx.amount} ${targetTx.symbol}`);
    } else {
      console.log('\n❌ The specific deposit transaction was not found in the results');
    }

  } catch (error) {
    console.error('❌ Error testing deposit detection:', error.message);
  }
}

testDepositDetection();