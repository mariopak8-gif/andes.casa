# Arbitrum Quick Reference Guide

## 🚀 Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install ethers@^6 axios
```

### 2. Set Environment Variables
```bash
# .env.local
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
USDT_CONTRACT_ADDRESS=0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9
MAIN_WALLET_PRIVATE_KEY=0x...
MAIN_WALLET_ADDRESS=0x...
ETH_FUND_AMOUNT=0.01
CRON_SECRET=your-secret
FORCE_TESTNET=false
NODE_ENV=production
```

### 3. Test Locally
```bash
export FORCE_TESTNET=true
npm run dev

# Then test
curl http://localhost:3000/api/arbitrum/deposit/address
```

---

## 📍 File Locations

### Utilities
- `lib/arbitrum/config.ts` - Network config
- `lib/arbitrum/utils.ts` - ethers.js utilities
- `server/arbitrumService.ts` - Sweep service

### API Endpoints
- `app/api/arbitrum/deposit/address/route.ts` - Get/generate address
- `app/api/arbitrum/check-deposits/route.ts` - Manual check
- `app/api/arbitrum/poll-deposits/route.ts` - Cron job

### Database
- `convex/schema.ts` - Schema (already supports Arbitrum)
- `convex/deposit.ts` - Deposit mutations

### Documentation
- `ARBITRUM_MIGRATION_GUIDE.md` - Full guide
- `ARBITRUM_ENV_SETUP.md` - Environment setup
- `ARBITRUM_IMPLEMENTATION_SUMMARY.md` - What was built

---

## 🔑 Key Functions

### Generate Address
```typescript
import { generateArbitrumAddress } from '@/lib/arbitrum/utils';

const { address, privateKey } = await generateArbitrumAddress();
// address: "0x..."
// privateKey: "0x..."
```

### Get Balance
```typescript
import { getAccountBalance } from '@/lib/arbitrum/utils';

const balance = await getAccountBalance("0x...");
// { eth: 0.5, usdt: 100 }
```

### Get Transactions
```typescript
import { getNewTransactions } from '@/lib/arbitrum/utils';

const txs = await getNewTransactions("0x...", lastCheckTime);
// Returns: Array of TransactionInfo objects
```

### Sweep USDT
```typescript
import { sweepUsdtFromAddress } from '@/server/arbitrumService';

const result = await sweepUsdtFromAddress(
  depositAddress,
  hotWalletAddress,
  depositPrivateKey
);
// { txId, amount, rawAmount }
```

---

## 🌐 Network URLs

### Arbitrum Mainnet
- RPC: `https://arb1.arbitrum.io/rpc`
- Explorer: `https://arbiscan.io`
- USDT: `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9`

### Arbitrum Sepolia (Testnet)
- RPC: `https://sepolia-rollup.arbitrum.io/rpc`
- Explorer: `https://sepolia.arbiscan.io`
- USDT: `0x75c0260fb7443de873cEFe882eC163D8152e6e7F`

---

## 🧪 Testing

### Test Deposit Check
```bash
curl http://localhost:3000/api/arbitrum/check-deposits \
  -H "Authorization: Bearer $SESSION_TOKEN"
```

### Test Cron Job
```bash
curl -X POST http://localhost:3000/api/arbitrum/poll-deposits \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Verify on Arbiscan
- Mainnet: https://arbiscan.io
- Testnet: https://sepolia.arbiscan.io

---

## ⚡ Performance Tips

1. **Gas Optimization**
   - ETH_FUND_AMOUNT: 0.001-0.01 ETH usually sufficient
   - Arbitrum ~12x cheaper than Ethereum L1

2. **Speed**
   - Confirmations: 5-15 seconds vs 60+ on Tron
   - Deploy with proper RPC endpoint

3. **Reliability**
   - Use primary RPC: arb1.arbitrum.io
   - Optional backup: Alchemy, Infura

---

## 🔒 Security Checklist

- [ ] Private keys in .env.local (never committed)
- [ ] CRON_SECRET is strong (32+ characters)
- [ ] Hot wallet has sufficient ETH
- [ ] RPC URL is official Arbitrum endpoint
- [ ] USDT contract matches network
- [ ] Database backups configured
- [ ] Audit logging enabled

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "No transactions" | Wait 30s, verify address on Arbiscan |
| "Insufficient ETH" | Fund hot wallet with ETH |
| "Invalid contract" | Verify USDT_CONTRACT_ADDRESS for network |
| "Connection failed" | Check ARBITRUM_RPC_URL is reachable |
| "Key mismatch" | Verify private key matches address |

---

## 📱 Common Commands

### Check Hot Wallet ETH Balance
```bash
node -e "
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
provider.getBalance('0x...').then(bal => console.log(ethers.formatEther(bal)));
"
```

### Check USDT Balance
```bash
node -e "
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
const abi = ['function balanceOf(address) view returns (uint256)'];
const contract = new ethers.Contract('0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', abi, provider);
contract.balanceOf('0x...').then(bal => console.log(ethers.formatUnits(bal, 6)));
"
```

### Get Testnet ETH
- [QuickNode Faucet](https://faucet.quicknode.com/arbitrum/sepolia)
- [Chainlink Faucet](https://faucets.chain.link/arbitrum-sepolia)

---

## 📞 Quick Links

- [Arbitrum Docs](https://docs.arbitrum.io/)
- [Ethers.js Docs](https://docs.ethers.org/v6/)
- [Arbiscan](https://arbiscan.io/)
- [Full Migration Guide](./ARBITRUM_MIGRATION_GUIDE.md)
- [Environment Setup](./ARBITRUM_ENV_SETUP.md)

---

## ✅ Verification Checklist

- [ ] Ethers.js installed (`npm list ethers`)
- [ ] .env.local configured
- [ ] RPC endpoint responsive
- [ ] Hot wallet funded with ETH
- [ ] CRON_SECRET set
- [ ] Can generate deposit address
- [ ] Can check deposits
- [ ] Cron job configured

---

**Need help?** See full guides in:
- `ARBITRUM_MIGRATION_GUIDE.md`
- `ARBITRUM_ENV_SETUP.md`
- `ARBITRUM_IMPLEMENTATION_SUMMARY.md`
