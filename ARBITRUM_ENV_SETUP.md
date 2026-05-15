# Arbitrum Environment Variables Setup

## Quick Start

Copy this template to `.env.local`:

```bash
# ─────────────────────────────────────────────────────────────────────────
# ARBITRUM NETWORK CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────

# Which RPC endpoint to use
# Production: Arbitrum One Mainnet
# Development: Arbitrum Sepolia Testnet
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc

# ─────────────────────────────────────────────────────────────────────────
# USDT ERC20 CONTRACT ADDRESS
# ─────────────────────────────────────────────────────────────────────────

# Arbitrum One Mainnet - USDT
USDT_CONTRACT_ADDRESS=0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9

# ─────────────────────────────────────────────────────────────────────────
# HOT WALLET (Sweep Destination)
# ─────────────────────────────────────────────────────────────────────────

# Private key in hex format (64 characters + 0x prefix)
# ⚠️  NEVER commit this to git!
# Generate: ethers.Wallet.createRandom().privateKey
MAIN_WALLET_PRIVATE_KEY=0x1234567890abcdef...

# Corresponding wallet address (for verification)
MAIN_WALLET_ADDRESS=0x1234567890abcdef1234567890abcdef12345678

# ─────────────────────────────────────────────────────────────────────────
# GAS CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────

# Amount of ETH to send to user addresses for gas (per sweep attempt)
# On Arbitrum, 0.001 ETH is usually sufficient
# Increase if transactions are failing due to low gas
ETH_FUND_AMOUNT=0.01

# ─────────────────────────────────────────────────────────────────────────
# CRON JOB AUTHENTICATION
# ─────────────────────────────────────────────────────────────────────────

# Secret token for cron job to authenticate with /api/arbitrum/poll-deposits
# Use a strong random string: openssl rand -hex 32
CRON_SECRET=your-secret-cron-token-here

# ─────────────────────────────────────────────────────────────────────────
# BLOCKCHAIN EXPLORER API (Optional - for transaction lookups)
# ─────────────────────────────────────────────────────────────────────────

# Get free API key at: https://arbiscan.io/apis
# Leave blank to use unauthenticated requests (rate limited)
ARBISCAN_API_KEY=your-arbiscan-api-key

# ─────────────────────────────────────────────────────────────────────────
# NETWORK SELECTION (Development/Testing)
# ─────────────────────────────────────────────────────────────────────────

# Force testnet (Arbitrum Sepolia) even if NODE_ENV is production
# Remove or set to 'false' for production mainnet
FORCE_TESTNET=false

# Set to 'production' for mainnet, 'development' for testnet
NODE_ENV=development
```

## Detailed Setup Instructions

### 1. Generate Hot Wallet

If you don't have a hot wallet yet:

```bash
node -e "
const { ethers } = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log('✅ New Hot Wallet Generated:');
console.log('Address:     ', wallet.address);
console.log('Private Key: ', wallet.privateKey);
console.log('Mnemonic:    ', wallet.mnemonic.phrase);
"
```

Save these securely. You'll use them for `MAIN_WALLET_ADDRESS` and `MAIN_WALLET_PRIVATE_KEY`.

### 2. Fund Hot Wallet with ETH

The hot wallet needs ETH to pay for gas when sweeping USDT deposits.

**Testnet (Sepolia):**
- Free ETH from faucets
- [Arbitrum Sepolia Faucet](https://faucet.quicknode.com/arbitrum/sepolia)
- [Chainlink Faucet](https://faucets.chain.link/arbitrum-sepolia)
- Recommended: 0.5-1 ETH for testing

**Mainnet:**
- Purchase from exchange or bridge from L1
- Use centralized exchange: Binance, Kraken, etc.
- Or bridge from Ethereum mainnet
- Recommended: 0.5-1 ETH for production

### 3. Set Environment Variables

#### Option A: `.env.local` (Development)

```bash
# .env.local (development, never commit)
ARBITRUM_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
USDT_CONTRACT_ADDRESS=0xEf54C221Fc94517877F0F40eCd71E0A3866D66C2
MAIN_WALLET_PRIVATE_KEY=0x...
MAIN_WALLET_ADDRESS=0x...
ETH_FUND_AMOUNT=0.01
CRON_SECRET=your-test-secret
FORCE_TESTNET=true
NODE_ENV=development
```

#### Option B: Vercel (Production)

Go to **Settings → Environment Variables**:

```
ARBITRUM_RPC_URL = https://arb1.arbitrum.io/rpc
USDT_CONTRACT_ADDRESS = 0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9
MAIN_WALLET_PRIVATE_KEY = 0x... (stored as secret)
MAIN_WALLET_ADDRESS = 0x...
ETH_FUND_AMOUNT = 0.01
CRON_SECRET = your-production-secret (strong random string)
NODE_ENV = production
FORCE_TESTNET = (leave empty or false)
```

#### Option C: Self-hosted

Set as environment variables or in `.env` file:

```bash
export ARBITRUM_RPC_URL="https://arb1.arbitrum.io/rpc"
export USDT_CONTRACT_ADDRESS="0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"
export MAIN_WALLET_PRIVATE_KEY="0x..."
export MAIN_WALLET_ADDRESS="0x..."
export ETH_FUND_AMOUNT="0.01"
export CRON_SECRET="your-secret"
export NODE_ENV="production"
```

### 4. Create CRON_SECRET

Generate a strong random secret:

```bash
# macOS / Linux
openssl rand -hex 32

# Windows PowerShell
[System.Convert]::ToHexString([System.Random]::new().GetBytes(32))

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Store this in your environment. You'll use it to authenticate cron jobs.

### 5. Optional: Get Arbiscan API Key

For better transaction history reliability:

1. Go to https://arbiscan.io/apis
2. Create free account
3. Create API key
4. Add to environment: `ARBISCAN_API_KEY=your_key`

## Environment Variable Reference

### Network Configuration

| Variable | Purpose | Value | Notes |
|----------|---------|-------|-------|
| `ARBITRUM_RPC_URL` | RPC endpoint | URL | Required. Use testnet or mainnet URL |
| `NODE_ENV` | Environment | `production` or `development` | Determines network if FORCE_TESTNET not set |
| `FORCE_TESTNET` | Override network | `true` or undefined | Forces Sepolia testnet |

### Contract Configuration

| Variable | Purpose | Value | Notes |
|----------|---------|-------|-------|
| `USDT_CONTRACT_ADDRESS` | USDT token address | 0x... address | Must match current network |
| `MAIN_WALLET_ADDRESS` | Hot wallet address | 0x... address | Destination for swept USDT |
| `MAIN_WALLET_PRIVATE_KEY` | Hot wallet private key | 0x... (64 chars) | ⚠️ NEVER commit to git |

### Gas Configuration

| Variable | Purpose | Value | Notes |
|----------|---------|-------|-------|
| `ETH_FUND_AMOUNT` | ETH for gas per sweep | 0.001 - 0.1 | Increase if failing. On Arbitrum, 0.001 usually sufficient |

### Authentication

| Variable | Purpose | Value | Notes |
|----------|---------|-------|-------|
| `CRON_SECRET` | Cron job auth token | Random string (32+ chars) | Required for `/api/arbitrum/poll-deposits` |
| `ARBISCAN_API_KEY` | Explorer API key | Your API key | Optional, for reliable tx history |

## Network Selection

### Testnet (Arbitrum Sepolia)

Used for **development and testing**:

```bash
FORCE_TESTNET=true
# OR
NODE_ENV=development

ARBITRUM_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
USDT_CONTRACT_ADDRESS=0xEf54C221Fc94517877F0F40eCd71E0A3866D66C2
```

**Get test USDT:**
1. Get test ETH from faucet
2. Or use mock USDT token on testnet

### Mainnet (Arbitrum One)

Used for **production**:

```bash
FORCE_TESTNET=false
# OR
NODE_ENV=production

ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
USDT_CONTRACT_ADDRESS=0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9
```

**Fund hot wallet:**
1. Buy ETH from exchange
2. Send to hot wallet address
3. Verify on https://arbiscan.io

## Validation Checklist

- [ ] `ARBITRUM_RPC_URL` is correct URL for network
- [ ] `USDT_CONTRACT_ADDRESS` matches network (mainnet or testnet)
- [ ] `MAIN_WALLET_PRIVATE_KEY` starts with `0x` and is 66 chars long
- [ ] `MAIN_WALLET_ADDRESS` matches the private key (validate with ethers.js)
- [ ] `MAIN_WALLET_ADDRESS` has sufficient ETH for gas
- [ ] `ETH_FUND_AMOUNT` is between 0.001 and 0.1
- [ ] `CRON_SECRET` is strong random string (32+ chars)
- [ ] `.env.local` is in `.gitignore` (never commit secrets)
- [ ] `NODE_ENV` or `FORCE_TESTNET` is set correctly

## Verification Commands

### Test RPC Connection

```bash
curl -X POST https://arb1.arbitrum.io/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Verify Hot Wallet

```bash
node -e "
const { ethers } = require('ethers');
const pk = '0x...'; // Your private key
const wallet = new ethers.Wallet(pk);
console.log('Address from key:', wallet.address);
console.log('Expected:       ', '0x...');
console.log('Match:', wallet.address === '0x...'.toLowerCase());
"
```

### Check ETH Balance

```bash
node -e "
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
provider.getBalance('0x...').then(bal => {
  console.log('ETH Balance:', ethers.formatEther(bal));
});
"
```

### Check USDT Balance

```bash
node -e "
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
const usdt = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9';
const abi = ['function balanceOf(address) view returns (uint256)'];
const contract = new ethers.Contract(usdt, abi, provider);
contract.balanceOf('0x...').then(bal => {
  console.log('USDT Balance:', ethers.formatUnits(bal, 6));
});
"
```

## Troubleshooting

### "Cannot read property 'name' of undefined"
- **Cause**: RPC URL is invalid or unreachable
- **Fix**: Verify `ARBITRUM_RPC_URL` is correct and online

### "Unknown contract (no bytecode at address)"
- **Cause**: Wrong USDT contract address for network
- **Fix**: Verify `USDT_CONTRACT_ADDRESS` matches mainnet or testnet

### "insufficient funds for gas"
- **Cause**: Hot wallet ETH balance too low
- **Fix**: Fund wallet with ETH from faucet or exchange

### "Key mismatch"
- **Cause**: Private key doesn't generate the expected address
- **Fix**: Verify key with ethers.js validator

## Best Practices

1. **Never commit secrets**
   - Add `.env.local` to `.gitignore`
   - Use secrets management for Vercel/hosting

2. **Use testnet first**
   - Always test with `FORCE_TESTNET=true`
   - Verify sweep flow works before production

3. **Monitor hot wallet**
   - Check ETH balance regularly
   - Set alerts if below threshold
   - Fund proactively, not reactively

4. **Rotate secrets periodically**
   - Generate new `CRON_SECRET` quarterly
   - Update in all cron services

5. **Keep ethers.js updated**
   - Run `npm update ethers`
   - Check for security patches

## Support

If you encounter issues:

1. Check `.env.local` is properly formatted
2. Verify all required variables are set
3. Test RPC connection directly
4. Check hot wallet has ETH
5. Review logs in `/api/arbitrum/*` endpoints
6. Check [Arbitrum docs](https://docs.arbitrum.io/) and [ethers.js docs](https://docs.ethers.org/)
