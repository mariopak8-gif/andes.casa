# Arbitrum Migration Guide

## Overview

This guide documents the complete migration from TRC20 (Tron) to Arbitrum One for USDT deposits and sweeps.

## Key Changes

### Removed Components
- ❌ TronWeb library
- ❌ TRX energy funding logic
- ❌ Bandwidth handling
- ❌ TronGrid API integration
- ❌ `lib/tron/` directory
- ❌ `app/api/tron/` endpoints
- ❌ `/server/tronService.ts` (replaced with arbitrumService.ts)

### New Components
- ✅ ethers.js (v6+) for Ethereum-compatible chains
- ✅ Arbitrum RPC integration
- ✅ Arbiscan API for transaction history
- ✅ `lib/arbitrum/` utilities
- ✅ `app/api/arbitrum/` endpoints
- ✅ `/server/arbitrumService.ts`

### Architecture Differences

| Aspect | Tron (TRC20) | Arbitrum (ERC20) |
|--------|-------------|-----------------|
| **Library** | TronWeb | ethers.js v6 |
| **Address Format** | `T...` (34 chars) | `0x...` (42 chars) |
| **Private Key** | 64-char hex (same) | 64-char hex (same) |
| **Contract Decimals** | 6 | 6 |
| **Gas Model** | Energy + Bandwidth | Standard ETH gas |
| **Fee Delegation** | Hot wallet pays energy | Hot wallet pays gas (ETH) |
| **Block Time** | ~3 seconds | ~0.25 seconds |
| **Confirmations** | 19 for finality | 2+ for safety |
| **RPC Provider** | TronGrid | Arbitrum RPC or Alchemy |
| **Explorer** | Tronscan | Arbiscan |

## Environment Variables

### Required Variables

Create/update `.env.local` with these values:

```bash
# ─── Arbitrum Network ───────────────────────────────────────────────────
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc                    # Mainnet
# ARBITRUM_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc         # Testnet

# ─── USDT Contract Address ──────────────────────────────────────────────
USDT_CONTRACT_ADDRESS=0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9  # Arbitrum Mainnet
# USDT_CONTRACT_ADDRESS=0xEf54C221Fc94517877F0F40eCd71E0A3866D66C2  # Arbitrum Sepolia

# ─── Hot Wallet (Sweep Destination) ─────────────────────────────────────
MAIN_WALLET_PRIVATE_KEY=0x...                                    # 64-char hex
MAIN_WALLET_ADDRESS=0x...                                        # 42-char address

# ─── Gas Configuration ───────────────────────────────────────────────────
ETH_FUND_AMOUNT=0.01                                             # ETH to send for gas

# ─── Cron Job Authentication ────────────────────────────────────────────
CRON_SECRET=your-secret-token-here

# ─── Etherscan API (Optional but Recommended) ────────────────────────────
ARBISCAN_API_KEY=your-arbiscan-api-key                           # Get from arbiscan.io
```

### Environment Variable Reference

| Variable | Purpose | Format | Example |
|----------|---------|--------|---------|
| `ARBITRUM_RPC_URL` | Arbitrum node RPC endpoint | URL | `https://arb1.arbitrum.io/rpc` |
| `USDT_CONTRACT_ADDRESS` | USDT ERC20 token contract | 0x address | `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9` |
| `MAIN_WALLET_PRIVATE_KEY` | Hot wallet private key | 64-char hex (0x-prefixed) | `0xabcd1234...` |
| `MAIN_WALLET_ADDRESS` | Hot wallet address | 42-char address | `0x1234...` |
| `ETH_FUND_AMOUNT` | ETH amount for gas (per sweep) | Number | `0.01` |
| `CRON_SECRET` | Secret for cron job authentication | String | Custom secret |
| `ARBISCAN_API_KEY` | Arbiscan API key for transaction queries | String | Get from arbiscan.io |
| `FORCE_TESTNET` | Force testnet (Sepolia) regardless of NODE_ENV | `'true'` or undefined | `'true'` |

## USDT Contract Addresses

### Mainnet (Production)
```
Chain: Arbitrum One (42161)
USDT: 0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9
Decimals: 6
Explorer: https://arbiscan.io/token/0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9
```

### Testnet (Development)
```
Chain: Arbitrum Sepolia (421614)
USDT: 0xEf54C221Fc94517877F0F40eCd71E0A3866D66C2
Decimals: 6
Explorer: https://sepolia.arbiscan.io/token/0xEf54C221Fc94517877F0F40eCd71E0A3866D66C2
```

## Hot Wallet Setup

### 1. Generate Hot Wallet (if needed)

```bash
node -e "
const { ethers } = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
"
```

### 2. Fund Hot Wallet with ETH

The hot wallet needs ETH to pay for gas when sweeping USDT. Recommended amounts:

- **Testnet (Sepolia)**: 0.5 ETH (free from faucets)
- **Mainnet**: 0.5-1 ETH depending on usage

Get testnet ETH from:
- [Arbitrum Sepolia Faucet](https://faucet.quicknode.com/arbitrum/sepolia)
- [Chainlink Faucet](https://faucets.chain.link/arbitrum-sepolia)

### 3. Store Securely

```bash
# .env.local (never commit this)
MAIN_WALLET_PRIVATE_KEY=0x1234abcd...
MAIN_WALLET_ADDRESS=0x5678efgh...
```

## Migration Steps

### Step 1: Install Dependencies

```bash
npm install ethers@^6 axios
```

### Step 2: Update Environment Variables

```bash
# Remove old Tron variables:
# TRONGRID_API_KEY
# TRONGRID_API_URL

# Add new Arbitrum variables (see above)
```

### Step 3: Run Convex Migrations

The schema already supports `depositAddresses.arbitrum` and `depositPrivateKeys.arbitrum`, so no schema changes needed.

### Step 4: Test in Development

```bash
# Use Arbitrum Sepolia testnet
export FORCE_TESTNET=true
export NODE_ENV=development

# Test deposit address generation
curl http://localhost:3000/api/arbitrum/deposit/address

# Test deposit check
curl http://localhost:3000/api/arbitrum/check-deposits
```

### Step 5: Enable in Frontend

Update [components/DepositForm.tsx](components/DepositForm.tsx) to show Arbitrum option:

```tsx
const supportedNetworks = [
  { id: 'arbitrum', name: 'Arbitrum One', minDeposit: 10 },
  // { id: 'trc20', name: 'Tron (TRC20)', minDeposit: 10 },  // Deprecated
];
```

### Step 6: Configure Cron Job

Set up automated deposit checks by calling:

```bash
# Every minute
curl -X POST http://your-app/api/arbitrum/poll-deposits \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Popular cron services:**
- [EasyCron](https://www.easycron.com/) (free)
- [Vercel Cron](https://vercel.com/docs/cron-jobs) (free with Vercel deployment)
- [AWS EventBridge](https://aws.amazon.com/eventbridge/)
- Self-hosted: PM2, node-cron, etc.

## File Changes Summary

### Created Files
- ✅ `lib/arbitrum/config.ts` - Arbitrum network configuration
- ✅ `lib/arbitrum/utils.ts` - ethers.js utilities and balance queries
- ✅ `server/arbitrumService.ts` - Sweep implementation with gas handling
- ✅ `app/api/arbitrum/deposit/address/route.ts` - Address generation endpoint
- ✅ `app/api/arbitrum/check-deposits/route.ts` - Manual deposit check
- ✅ `app/api/arbitrum/poll-deposits/route.ts` - Automated cron endpoint

### Modified Files
- `convex/schema.ts` - Already supports Arbitrum fields
- `components/DepositForm.tsx` - Add network selection
- `app/(dashboard)/deposit/DepositContent.tsx` - Add Arbitrum option
- `lib/hooks/useDepositAddress.ts` - Support Arbitrum parameter
- `lib/depositAddresses.ts` - Add Arbitrum constants

### Deprecated Files (can be removed)
- `lib/tron/` - Old TronWeb utilities
- `app/api/tron/` - Old Tron endpoints
- `server/tronService.ts` - Old Tron sweep logic

## Testing

### 1. Manual Deposit Check

```bash
# Get or generate deposit address
GET /api/arbitrum/deposit/address

# Check for new deposits
GET /api/arbitrum/check-deposits
```

### 2. Test Sweep Flow

```bash
# Send test USDT to deposit address via Arbitrum Sepolia
# Then call check-deposits to verify sweep

curl http://localhost:3000/api/arbitrum/check-deposits
```

### 3. Verify on-chain

- Explorer: https://sepolia.arbiscan.io (testnet) or https://arbiscan.io (mainnet)
- Search for deposit address or tx hash

## Monitoring

### Dashboard Updates
- Admin dashboard should show "Arbitrum" in network column
- Transaction history will show Arbitrum deposits with 0x addresses

### Logs to Watch

```
[PROVIDER] Connected to arbitrum-...
[WALLET] Initialized for 0x...
[SWEEP] From: 0x... → To: 0x...
[SWEEP] ✅ Confirmed
[DB] Transaction recorded
```

## Troubleshooting

### Issue: "No new transactions found"
**Cause**: Arbiscan API delay or no USDT transfers  
**Fix**: Wait 30 seconds and try again, verify deposit address on explorer

### Issue: "Insufficient ETH for gas"
**Cause**: Hot wallet ETH balance too low  
**Fix**: Fund hot wallet with ETH from faucet or exchange

### Issue: "Invalid contract address"
**Cause**: Wrong USDT contract for network  
**Fix**: Verify `USDT_CONTRACT_ADDRESS` matches current network (mainnet vs testnet)

### Issue: Sweep fails with "Key mismatch"
**Cause**: Private key doesn't match deposit address  
**Fix**: Regenerate deposit address or restore correct private key

## Performance Metrics

### Arbitrum vs Tron

| Metric | Tron | Arbitrum |
|--------|------|----------|
| Block time | 3 sec | 0.25 sec |
| Confirmation time | 57 sec (19 blocks) | 6 sec (24 blocks) |
| Gas cost (USDT transfer) | ~100 TRX (~$2) | 0.0001-0.0005 ETH (~$0.25-$1.25) |
| Network capacity | Lower | Higher (Ethereum L2) |
| Reliability | Good | Excellent (backed by Ethereum) |

## Rollback Plan (if needed)

To revert to Tron:

1. Switch RPC endpoint back to TronGrid
2. Change `depositAddresses.trc20` usage instead of `arbitrum`
3. Restore old API routes from git history
4. Update frontend to use Tron network

**Note**: Users who already have Arbitrum addresses will keep them - both networks can coexist in the schema.

## Security Checklist

- ✅ Private keys stored in Convex only (never sent to client)
- ✅ Verify address-to-key mapping before sweep
- ✅ Use testnet first for validation
- ✅ Monitor hot wallet ETH balance
- ✅ Enable CRON_SECRET authentication
- ✅ Use HTTPS in production
- ✅ Regularly audit transaction logs
- ✅ Keep ethers.js updated

## Support & Resources

- **Arbitrum Docs**: https://docs.arbitrum.io/
- **Ethers.js Docs**: https://docs.ethers.org/v6/
- **Arbiscan**: https://arbiscan.io/
- **Arbitrum Discord**: https://discord.gg/arbitrum
