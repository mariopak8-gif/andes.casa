// lib/arbitrum/config.ts

import { ethers } from "ethers";

export const ARBITRUM_CONFIG = {
  // 🧪 Sepolia Testnet (development)
  SEPOLIA: {
    chainId: 421614,
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    network: "arbitrum-sepolia",
    explorer: "https://sepolia.arbiscan.io",
  },

  // 🚀 Mainnet (production)
  MAINNET: {
    chainId: 42161,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    network: "arbitrum-mainnet",
    explorer: "https://arbiscan.io",
  },
} as const;

// 🔁 Auto-switch network
// FORCE_TESTNET overrides NODE_ENV for explicit testnet use
const defaultNetwork =
  process.env.FORCE_TESTNET === 'true'
    ? ARBITRUM_CONFIG.SEPOLIA
    : process.env.NODE_ENV === "production"
    ? ARBITRUM_CONFIG.MAINNET
    : ARBITRUM_CONFIG.SEPOLIA;

const envRpcUrl = process.env.ARBITRUM_RPC_URL?.trim();
const envExplorerUrl = process.env.ARBITRUM_EXPLORER_URL?.trim();

export const ACTIVE_NETWORK = {
  ...defaultNetwork,
  rpcUrl: envRpcUrl || defaultNetwork.rpcUrl,
  explorer: envExplorerUrl || defaultNetwork.explorer,
};

const envNetworkName = process.env.FORCE_TESTNET === 'true' ? 'Arbitrum Sepolia' : process.env.NODE_ENV === 'production' ? 'Arbitrum Mainnet' : 'Arbitrum Sepolia';

if (envRpcUrl) {
  const expectedRpcUrl = defaultNetwork.rpcUrl;
  if (envRpcUrl !== expectedRpcUrl) {
    console.warn(
      `⚠️ [ARBITRUM CONFIG] Environment override detected: ARBITRUM_RPC_URL=${envRpcUrl}` +
      ` but active network is ${envNetworkName}. Expected RPC URL for this network is ${expectedRpcUrl}.`
    );
  }
}

// ✅ CORRECT ERC20 USDT CONTRACTS (on Arbitrum)
export const USDT_CONTRACT = {
  // Arbitrum Sepolia Testnet USDT
  SEPOLIA: "0xEf54C221Fc94517877F0F40eCd71E0A3866D66C2",

  // Arbitrum Mainnet USDT
  MAINNET: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
} as const;

const envUsdtValue =
  process.env.ARBITRUM_USDT_CONTRACT_ADDRESS?.trim() ||
  process.env.USDT_CONTRACT_ADDRESS?.trim();

const envUsdtVarName = process.env.ARBITRUM_USDT_CONTRACT_ADDRESS?.trim()
  ? 'ARBITRUM_USDT_CONTRACT_ADDRESS'
  : process.env.USDT_CONTRACT_ADDRESS?.trim()
  ? 'USDT_CONTRACT_ADDRESS'
  : undefined;

let envUsdtContract: string | undefined;
if (envUsdtValue) {
  const rawValue = envUsdtValue;
  const cleanedValue = rawValue.toLowerCase().startsWith('c0x')
    ? `0x${rawValue.slice(3)}`
    : rawValue;

  try {
    envUsdtContract = ethers.getAddress(cleanedValue);
  } catch (e: any) {
    console.warn(
      `⚠️ [ARBITRUM CONFIG] Invalid ${envUsdtVarName ?? 'USDT contract address'}: ${rawValue}. ${e?.message}`,
    );
    envUsdtContract = undefined;
  }

  const expectedContract = process.env.FORCE_TESTNET === 'true'
    ? USDT_CONTRACT.SEPOLIA
    : process.env.NODE_ENV === 'production'
    ? USDT_CONTRACT.MAINNET
    : USDT_CONTRACT.SEPOLIA;

  if (envUsdtContract && envUsdtContract.toLowerCase() !== expectedContract.toLowerCase()) {
    console.warn(
      `⚠️ [ARBITRUM CONFIG] Environment override detected: ${envUsdtVarName ?? 'USDT contract address'}=${envUsdtContract}` +
        ` but active network is ${envNetworkName}. Expected USDT contract for this network is ${expectedContract}.`,
    );
    // Allow the override anyway since both contracts may be valid
    // envUsdtContract = undefined;
  }
}

// 🎯 Active USDT contract
export const ACTIVE_USDT_CONTRACT =
  envUsdtContract ||
  (process.env.FORCE_TESTNET === 'true'
    ? USDT_CONTRACT.SEPOLIA
    : process.env.NODE_ENV === "production"
    ? USDT_CONTRACT.MAINNET
    : USDT_CONTRACT.SEPOLIA);

// 💰 Minimum deposit thresholds
export const MIN_DEPOSIT = {
  ETH: 0.01,  // activation
  USDT: 20,
};

const envEthGasTopupUsd = Number(process.env.ETH_GAS_TOPUP_USD ?? '0.1');
export const ETH_GAS_TOPUP_USD =
  Number.isFinite(envEthGasTopupUsd) && envEthGasTopupUsd > 0
    ? envEthGasTopupUsd
    : 0.1;
