// server/arbitrumService.ts
import { ethers } from "ethers";
import { ACTIVE_NETWORK, ACTIVE_USDT_CONTRACT } from "@/lib/arbitrum/config";
import { getWalletWithKey, isValidPrivateKey } from "@/lib/arbitrum/utils";

const MAIN_WALLET_PRIVATE_KEY = process.env.MAIN_WALLET_PRIVATE_KEY ?? "";
const MAIN_WALLET_ADDRESS = process.env.MAIN_WALLET_ADDRESS ?? "";
const ETH_FUND_AMOUNT = Number(process.env.ETH_FUND_AMOUNT ?? "0.01");

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string") return maybeMessage;
  }
  return String(error);
}

function normalizeArbitrumAddress(address: string, label = "address"): string {
  if (!address || typeof address !== "string") {
    throw new Error(`[SWEEP] Invalid ${label}: ${address}`);
  }

  let normalized = address.trim();

  // Some address sources may accidentally prepend a non-standard 'c0x' prefix.
  if (normalized.toLowerCase().startsWith("c0x")) {
    normalized = `0x${normalized.slice(3)}`;
  }

  try {
    return ethers.getAddress(normalized);
  } catch (e: unknown) {
    throw new Error(
      `[SWEEP] Invalid ${label}: ${address} (${getErrorMessage(e)})`,
    );
  }
}

if (!MAIN_WALLET_PRIVATE_KEY) {
  console.warn("⚠️  MAIN_WALLET_PRIVATE_KEY not set");
}

export interface SweepResult {
  txId: string;
  amount: number;
  rawAmount: string;
}

function extractTxId(result: unknown): string | null {
  if (typeof result === "string" && result.startsWith("0x")) return result;
  if (typeof result === "object" && result !== null) {
    const typedResult = result as {
      hash?: unknown;
      transactionHash?: unknown;
      txid?: unknown;
    };
    if (typeof typedResult.hash === "string") return typedResult.hash;
    if (typeof typedResult.transactionHash === "string")
      return typedResult.transactionHash;
    if (typeof typedResult.txid === "string") return typedResult.txid;
  }
  return null;
}

export async function waitForConfirmation(
  provider: ethers.Provider,
  txId: string,
  attempts = 30,
  delayMs = 2_000,
): Promise<ethers.TransactionReceipt | null> {
  console.log(`[CONFIRM] Waiting for ${txId} (max ${attempts} × ${delayMs}ms)`);
  for (let i = 1; i <= attempts; i++) {
    try {
      const receipt = await provider.getTransactionReceipt(txId);
      if (receipt?.blockNumber) {
        console.log(`[CONFIRM] ✅ Block ${receipt.blockNumber} (attempt ${i})`);
        return receipt;
      }
    } catch (e: unknown) {
      console.debug(
        `[CONFIRM] Attempt ${i} - query failed: ${getErrorMessage(e)}`,
      );
    }
    console.log(`[CONFIRM] ${i}/${attempts} — pending`);
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(`[CONFIRM] ${txId} not confirmed after ${attempts} attempts`);
}

export async function sendEth(
  toAddress: string,
  amountEth = ETH_FUND_AMOUNT,
  skipConfirmation = false,
): Promise<string> {
  const normalizedToAddress = normalizeArbitrumAddress(
    toAddress,
    "recipient address",
  );
  const normalizedMainAddress = normalizeArbitrumAddress(
    MAIN_WALLET_ADDRESS,
    "main wallet address",
  );
  console.log(
    `\n[ETH SEND] From: ${normalizedMainAddress} → To: ${normalizedToAddress} | ${amountEth} ETH`,
  );
  if (!MAIN_WALLET_PRIVATE_KEY)
    throw new Error("[ETH SEND] MAIN_WALLET_PRIVATE_KEY not set");

  const wallet = await getWalletWithKey(MAIN_WALLET_PRIVATE_KEY);

  let result: unknown;
  try {
    result = await wallet.sendTransaction({
      to: normalizedToAddress,
      value: ethers.parseEther(amountEth.toFixed(18)),
    });
  } catch (e: unknown) {
    const errMsg = getErrorMessage(e);
    console.error(`[ETH SEND] ❌ Network error: ${errMsg}`);
    console.error(`[ETH SEND] Full error:`, e);
    throw new Error(`[ETH SEND] sendTransaction failed: ${errMsg}`);
  }

  console.log(`[ETH SEND] Raw result:`, JSON.stringify(result, null, 2));
  const txId = extractTxId(result);
  if (!txId)
    throw new Error(`[ETH SEND] No txId in result: ${JSON.stringify(result)}`);
  console.log(`[ETH SEND] ✅ txId: ${txId}`);

  if (!skipConfirmation) {
    try {
      const provider = wallet.provider;
      if (!provider) throw new Error("[ETH SEND] provider not available");
      await waitForConfirmation(provider, txId);
    } catch (e: unknown) {
      console.warn(`[ETH SEND] ⚠️  Timeout: ${getErrorMessage(e)}`);
    }
  }
  return txId;
}

export async function sweepUsdtFromAddress(
  depositAddress: string,
  hotWalletAddress: string,
  depositPrivateKey: string,
): Promise<SweepResult | null> {
  console.log(`\n[SWEEP] ${"─".repeat(50)}`);
  console.log(`[SWEEP] From:    ${depositAddress}`);
  console.log(`[SWEEP] To:      ${hotWalletAddress}`);
  console.log(`[SWEEP] Network: ${ACTIVE_NETWORK.rpcUrl}`);
  console.log(`[SWEEP] USDT:    ${ACTIVE_USDT_CONTRACT}`);

  if (!ACTIVE_USDT_CONTRACT)
    throw new Error("[SWEEP] USDT_CONTRACT_ADDRESS not set");
  if (!depositAddress) throw new Error("[SWEEP] depositAddress is empty");
  if (!hotWalletAddress) throw new Error("[SWEEP] hotWalletAddress is empty");
  if (!depositPrivateKey) throw new Error("[SWEEP] depositPrivateKey is empty");
  if (!MAIN_WALLET_PRIVATE_KEY)
    throw new Error("[SWEEP] MAIN_WALLET_PRIVATE_KEY not set");
  if (!MAIN_WALLET_ADDRESS)
    throw new Error("[SWEEP] MAIN_WALLET_ADDRESS not set");

  const normalizedDepositAddress = normalizeArbitrumAddress(
    depositAddress,
    "deposit address",
  );
  const normalizedHotWalletAddress = normalizeArbitrumAddress(
    hotWalletAddress,
    "hot wallet address",
  );

  if (!isValidPrivateKey(depositPrivateKey)) {
    throw new Error(
      `[SWEEP] Invalid private key (length: ${depositPrivateKey?.length ?? 0})`,
    );
  }

  const wallet = await getWalletWithKey(depositPrivateKey);
  const derivedAddress = wallet.address;
  console.log(`[SWEEP] Key derives to: ${derivedAddress}`);

  if (!derivedAddress)
    throw new Error("[SWEEP] Could not derive address from key");
  if (derivedAddress.toLowerCase() !== normalizedDepositAddress.toLowerCase()) {
    throw new Error(
      `[SWEEP] Key mismatch — key is for ${derivedAddress}, not ${normalizedDepositAddress}. ` +
        `Wrong private key stored in Convex for this deposit address.`,
    );
  }
  console.log(`[SWEEP] ✅ Key verified`);

  // Load USDT contract
  let contract: ethers.Contract;
  try {
    const usdtAbi = [
      "function balanceOf(address owner) view returns (uint256)",
      "function transfer(address to, uint256 amount) returns (bool)",
      "function approve(address spender, uint256 amount) returns (bool)",
    ];
    contract = new ethers.Contract(ACTIVE_USDT_CONTRACT, usdtAbi, wallet);
    console.log(`[SWEEP] ✅ Contract loaded`);
  } catch (e: unknown) {
    const errMsg = getErrorMessage(e);
    console.error(`[SWEEP] ❌ Contract load failed: ${errMsg}`);
    throw new Error(
      `[SWEEP] Failed to load contract at ${ACTIVE_USDT_CONTRACT}: ${errMsg}`,
    );
  }

  let rawBalance: bigint;
  try {
    rawBalance = await contract.balanceOf(normalizedDepositAddress);
    console.log(`[SWEEP] Raw balance: ${rawBalance.toString()}`);
  } catch (e: unknown) {
    const errMsg = getErrorMessage(e);
    console.error(`[SWEEP] ❌ Balance query failed: ${errMsg}`);
    throw new Error(
      `[SWEEP] balanceOf(${normalizedDepositAddress}) failed: ${errMsg}`,
    );
  }

  const rawAmountBN = rawBalance;
  const usdtAmount = parseFloat(ethers.formatUnits(rawAmountBN, 6)); // USDT has 6 decimals
  console.log(
    `[SWEEP] USDT balance: ${usdtAmount} (${rawAmountBN.toString()} base units)`,
  );

  if (!rawAmountBN || rawAmountBN === BigInt(0)) {
    console.log(`[SWEEP] Nothing to sweep`);
    return null;
  }

  console.log(
    `[SWEEP] Calling transfer(${normalizedHotWalletAddress}, ${rawAmountBN.toString()})...`,
  );
  let transferResult: unknown;
  try {
    const tx = await contract.transfer(normalizedHotWalletAddress, rawAmountBN);
    transferResult = await tx.wait();
    console.log(`[SWEEP] Raw result:`, JSON.stringify(transferResult, null, 2));
  } catch (e: unknown) {
    console.error(`[SWEEP] ❌ transfer failed:`);
    console.error(`  message: ${getErrorMessage(e)}`);
    console.error(
      `  full:`,
      JSON.stringify(e, Object.getOwnPropertyNames(e), 2),
    );
    const errMsg = getErrorMessage(e);
    throw new Error(
      `[SWEEP] transfer(${normalizedHotWalletAddress}, ${rawAmountBN.toString()}) failed: ${errMsg}`,
    );
  }

  const txId = extractTxId(transferResult);
  if (!txId)
    throw new Error(
      `[SWEEP] No txId in result: ${JSON.stringify(transferResult)}`,
    );
  console.log(`[SWEEP] txId: ${txId}`);

  try {
    const provider = wallet.provider;
    if (!provider) throw new Error("[SWEEP] provider not available");
    await waitForConfirmation(provider, txId);
    console.log(`[SWEEP] ✅ Confirmed`);
  } catch (e: unknown) {
    const errMsg = getErrorMessage(e);
    console.warn(`[SWEEP] ⚠️  Confirmation timeout (tx submitted): ${errMsg}`);
    console.warn(
      `[SWEEP] ⚠️  Please verify on-chain at: ${ACTIVE_NETWORK.explorer}/tx/${txId}`,
    );
  }

  console.log(`[SWEEP] ✅ Swept ${usdtAmount} USDT → ${hotWalletAddress}`);
  return { txId, amount: usdtAmount, rawAmount: rawAmountBN.toString() };
}

export default { waitForConfirmation, sendEth, sweepUsdtFromAddress };
