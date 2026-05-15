// lib/arbitrum/utils.ts
import { ethers } from 'ethers';
import axios from 'axios';
import { ACTIVE_NETWORK, ACTIVE_USDT_CONTRACT } from './config';

// ─── Provider Factories ────────────────────────────────────────────────────────

export async function getProvider() {
  const rpcUrl = ACTIVE_NETWORK.rpcUrl;
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const network = await provider.getNetwork();
    const networkName = network.name || 'unknown';
    const actualChainId = Number(network.chainId);
    const expectedChainId = Number(ACTIVE_NETWORK.chainId);

    console.log(
      `✅ [PROVIDER] Connected to ${ACTIVE_NETWORK.network}` +
      ` via ${rpcUrl} (${networkName} / chainId=${actualChainId})`
    );

    if (actualChainId !== expectedChainId) {
      console.warn(
        `⚠️ [PROVIDER] Active RPC chainId ${actualChainId} does not match expected ${expectedChainId}. ` +
        'This may indicate a network configuration mismatch.'
      );
    }

    return provider;
  } catch (e: any) {
    console.error(`❌ [PROVIDER] Init failed: ${e?.message}`);
    throw e;
  }
}

export async function getWalletWithKey(privateKey: string) {
  const provider = await getProvider();
  console.log(`🔧 [WALLET] Key valid: ${isValidPrivateKey(privateKey)}`);
  try {
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`✅ [WALLET] Initialized for ${wallet.address}`);
    return wallet;
  } catch (e: any) {
    console.error(`❌ [WALLET] Init failed: ${e?.message}`);
    throw e;
  }
}

// ─── Key / Address Utils ──────────────────────────────────────────────────────

export function isValidPrivateKey(privateKey: string): boolean {
  if (!privateKey) return false;
  // Ethereum private keys are 64 hex chars (32 bytes)
  return /^(0x)?[0-9a-fA-F]{64}$/.test(privateKey.trim());
}

export function isValidArbitrumAddress(address: string): boolean {
  try {
    normalizeArbitrumAddress(address);
    return true;
  } catch {
    return false;
  }
}

export function normalizeArbitrumAddress(address: string): string {
  if (!address || typeof address !== 'string') {
    throw new Error(`[ADDRESS] Invalid address: ${address}`);
  }

  let normalized = address.trim();
  if (normalized.toLowerCase().startsWith('c0x')) {
    normalized = `0x${normalized.slice(3)}`;
  }

  try {
    return ethers.getAddress(normalized);
  } catch (e: any) {
    throw new Error(`[ADDRESS] Invalid address: ${address} (${e?.message})`);
  }
}

export function getAddressFromPrivateKey(privateKey: string): { address: string; valid: boolean } {
  try {
    if (!isValidPrivateKey(privateKey)) return { address: '', valid: false };
    const wallet = new ethers.Wallet(privateKey);
    const address = wallet.address;
    return { address, valid: ethers.isAddress(address) };
  } catch (e) {
    console.error('[CRYPTO] Error deriving address:', e);
    return { address: '', valid: false };
  }
}

// ─── Address Generation ───────────────────────────────────────────────────────

/**
 * Generate a brand-new Ethereum/Arbitrum address.
 * The returned privateKey MUST be saved immediately — it cannot be recovered.
 */
export async function generateArbitrumAddress(): Promise<{
  address:    string;
  privateKey: string;
}> {
  try {
    const wallet = ethers.Wallet.createRandom();
    const privateKey = wallet.privateKey;
    const address = wallet.address;
    console.log(`[GENERATE] New address: ${address}`);
    return {
      address,
      privateKey,
    };
  } catch (e: any) {
    console.error('[GENERATE] Error:', e?.message);
    throw e;
  }
}

// ─── Balance ──────────────────────────────────────────────────────────────────

export interface AccountBalance {
  address: string;
  eth:     number;
  usdt:    number;
}

/**
 * Get ETH and USDT balance for any address.
 */
export async function getAccountBalance(address: string): Promise<AccountBalance> {
  const normalizedAddress = normalizeArbitrumAddress(address);
  console.log(`🔍 [BALANCE] Checking: ${normalizedAddress}`);

  const provider = await getProvider();

  // ── ETH ──────────────────────────────────────────────────────────────────
  const ethBalance = await provider.getBalance(normalizedAddress);
  const eth = parseFloat(ethers.formatEther(ethBalance));
  console.log(`✅ [BALANCE] ETH: ${eth}`);

  // ── USDT ──────────────────────────────────────────────────────────────────
  let usdt = 0;
  
  try {
    const contractAddress = ethers.getAddress(ACTIVE_USDT_CONTRACT);
    console.log(`[BALANCE] Querying USDT contract ${contractAddress} for ${normalizedAddress}`);
    const usdtAbi = [
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)',
    ];
    const contract = new ethers.Contract(contractAddress, usdtAbi, provider);
    const contractCode = await provider.getCode(contractAddress);

    if (!contractCode || contractCode === '0x' || contractCode === '0x0') {
      console.warn(
        `⚠️ [BALANCE] No contract code found at ${ACTIVE_USDT_CONTRACT} on ${ACTIVE_NETWORK.network}. ` +
        'Verify the active USDT contract address and network are correct.'
      );
      usdt = 0;
    } else {
      try {
        const rawBalance = await contract.balanceOf(normalizedAddress);
        usdt = parseFloat(ethers.formatUnits(rawBalance, 6)); // USDT has 6 decimals
        console.log(`✅ [BALANCE] USDT: ${usdt}`);
      } catch (contractErr: any) {
        console.warn(`⚠️ [BALANCE] Contract call failed: ${contractErr?.code} — ${contractErr?.message}`);
        console.log(`[BALANCE] Attempting raw RPC call as fallback...`);
        
        // Fallback: Try raw RPC staticCall
        try {
          const iface = new ethers.Interface(usdtAbi);
          const data = iface.encodeFunctionData('balanceOf', [normalizedAddress]);
          const result = await provider.call({
            to: contractAddress,
            data: data,
          });

          if (result && result !== '0x') {
            const decoded = iface.decodeFunctionResult('balanceOf', result);
            usdt = parseFloat(ethers.formatUnits(decoded[0] as bigint, 6));
            console.log(`✅ [BALANCE] USDT (raw RPC): ${usdt}`);
          } else {
            console.warn(`⚠️ [BALANCE] Raw RPC returned empty (0x) — likely no USDT balance`);
            usdt = 0;
          }
        } catch (rawErr: any) {
          console.warn(`⚠️ [BALANCE] Raw RPC fallback also failed: ${rawErr?.message}`);
          usdt = 0;
        }
      }
    }
  } catch (e: any) {
    console.warn(`⚠️ [BALANCE] USDT setup failed: ${e?.message}`);
    usdt = 0;
  }

  return { address, eth, usdt };
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export interface TransactionInfo {
  txHash: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  blockNumber: number;
  confirmed: boolean;
  type: 'usdt-transfer' | 'eth-transfer' | 'other';
}

/**
 * Fetch USDT transfers using RPC eth_getLogs (fallback when API unavailable)
 */
async function getNewTransactionsViaLogs(
  address: string,
  lastCheckTimestamp = 0
): Promise<TransactionInfo[]> {
  try {
    console.log(`[DEPOSITS] Attempting RPC-based log fetch (no API key needed)...`);
    const provider = await getProvider();

    // ERC20 Transfer event: Transfer(address indexed from, address indexed to, uint256 value)
    const transferEventSignature = '0xddf252ad1be2c97f6b3d37a87f6f1d47e5b6e1fba8c89c47ccd6e3d7c5dd9f42';

    // Get current block for confirmation check
    const currentBlock = await provider.getBlockNumber();
    const to = normalizeArbitrumAddress(address);

    // Query logs for transfers TO this address
    const filter = {
      address: ethers.getAddress(ACTIVE_USDT_CONTRACT),
      topics: [transferEventSignature, null, ethers.zeroPadValue(to, 32)], // to is indexed
      fromBlock: 'earliest',
      toBlock: 'latest',
    };

    const logs = await provider.getLogs(filter);
    const transactions: TransactionInfo[] = [];
    const now = Date.now();

    for (const log of logs) {
      // Decode the Transfer event: from, to, value
      const iface = new ethers.Interface(['event Transfer(address indexed from, address indexed to, uint256 value)']);
      const decoded = iface.parseLog(log);

      if (!decoded) continue;

      const fromAddr = (decoded.args as any)[0];
      const toAddr = (decoded.args as any)[1];
      const rawAmount = (decoded.args as any)[2] as bigint;
      const amount = parseFloat(ethers.formatUnits(rawAmount, 6)); // USDT has 6 decimals

      // Get block timestamp
      let timestamp = Date.now();
      try {
        const block = await provider.getBlock(log.blockNumber);
        if (block) {
          timestamp = Number(block.timestamp) * 1000;
        }
      } catch (e) {
        console.warn(`[DEPOSITS] Could not fetch block ${log.blockNumber}`);
      }

      // Skip old transactions
      if (lastCheckTimestamp && timestamp < lastCheckTimestamp) {
        console.log(`[DEPOSITS] Skipping old log: ${log.transactionHash}`);
        continue;
      }

      // Consider confirmed if at least 12 blocks deep
      const blockDepth = currentBlock - log.blockNumber;
      const confirmed = blockDepth >= 12;

      transactions.push({
        txHash: log.transactionHash,
        from: fromAddr,
        to: toAddr,
        amount: amount,
        timestamp: timestamp,
        blockNumber: log.blockNumber,
        confirmed: confirmed,
        type: 'usdt-transfer',
      });

      console.log(
        `[DEPOSITS] Found USDT transfer via logs: ${amount} from ${fromAddr} | ${log.transactionHash} | confirmed: ${confirmed}`
      );
    }

    return transactions;
  } catch (e: any) {
    console.warn(`⚠️ [DEPOSITS] RPC log fetch failed: ${e?.message}`);
    return [];
  }
}

/**
 * Query Arbitrum for USDT token transfers to an address
 * Tries Etherscan API V2 first, falls back to RPC eth_getLogs
 */
export async function getNewTransactions(address: string, lastCheckTimestamp = 0): Promise<TransactionInfo[]> {
  try {
    if (!ethers.isAddress(address)) {
      throw new Error(`Invalid address: ${address}`);
    }

    console.log(
      `[DEPOSITS] Fetching USDT transfers for ${address} since ${
        lastCheckTimestamp ? new Date(lastCheckTimestamp).toISOString() : 'never'
      }`
    );

    // Try Etherscan API V2 if key is available
    const apiKey =
      process.env.ARBISCAN_API_KEY || process.env.ETHERSCAN_API_KEY || '';

    if (apiKey && apiKey.length > 5) {
      try {
        console.log(`[DEPOSITS] Attempting Etherscan API V2 query...`);
        const chainId = ACTIVE_NETWORK.chainId?.toString() || '42161';
        const arbiscanApiUrl = 'https://api.etherscan.io/v2/api';

        const params = new URLSearchParams({
          module: 'account',
          action: 'tokentx',
          contractaddress: ACTIVE_USDT_CONTRACT,
          address: address,
          startblock: '0',
          endblock: '99999999',
          sort: 'desc',
          chainid: chainId,
          apikey: apiKey,
        });

        const response = await axios.get(`${arbiscanApiUrl}?${params.toString()}`, {
          timeout: 10000,
        });

        if (response.data.status === '1' && response.data.result) {
          const transactions: TransactionInfo[] = [];
          const now = Date.now();

          for (const tx of response.data.result) {
            const txTimestamp = Number(tx.timeStamp) * 1000;

            if (lastCheckTimestamp && txTimestamp < lastCheckTimestamp) {
              continue;
            }

            if (tx.to.toLowerCase() !== address.toLowerCase()) {
              continue;
            }

            const rawAmount = BigInt(tx.value || '0');
            const amount = parseFloat(ethers.formatUnits(rawAmount, 6));
            const blockTimestamp = Number(tx.blockNumber || '0');
            const confirmed = blockTimestamp > 0 && (now - txTimestamp > 15000);

            transactions.push({
              txHash: tx.hash,
              from: tx.from,
              to: tx.to,
              amount: amount,
              timestamp: txTimestamp,
              blockNumber: blockTimestamp,
              confirmed: confirmed,
              type: 'usdt-transfer',
            });

            console.log(
              `[DEPOSITS] Found USDT transfer (API): ${amount} from ${tx.from} | ${tx.hash}`
            );
          }

          if (transactions.length > 0) {
            return transactions;
          }
        } else {
          console.warn(
            `[DEPOSITS] API returned: status=${response.data.status} message=${response.data.message}`
          );
        }
      } catch (apiErr: any) {
        console.warn(`⚠️ [DEPOSITS] API query failed: ${apiErr?.message} — will try RPC fallback`);
      }
    } else {
      console.log(`[DEPOSITS] No valid API key — using RPC fallback`);
    }

    // Fallback to RPC-based log fetching
    console.log(`[DEPOSITS] Falling back to RPC eth_getLogs...`);
    return await getNewTransactionsViaLogs(address, lastCheckTimestamp);
  } catch (e: any) {
    console.error('❌ [DEPOSITS] Error fetching transactions:', e?.message);
    console.log(`[DEPOSITS] Attempting RPC fallback as last resort...`);
    try {
      return await getNewTransactionsViaLogs(address, lastCheckTimestamp);
    } catch (fallbackErr: any) {
      console.error('❌ [DEPOSITS] RPC fallback also failed:', fallbackErr?.message);
      return [];
    }
  }
}

// ─── Transfer USDT (hot wallet → recipient) ───────────────────────────────────

export async function transferUsdt(
  privateKey: string,
  toAddress:  string,
  amount:     number
): Promise<{ transactionId: string; success: boolean; error?: string }> {
  try {
    console.log(`[TRANSFER] ${amount} USDT → ${toAddress}`);

    const positiveAmount = Math.abs(amount);
    if (!isValidPrivateKey(privateKey)) throw new Error('Invalid private key format');
    if (!ethers.isAddress(toAddress)) throw new Error(`Invalid recipient: ${toAddress}`);
    if (!ethers.isAddress(ACTIVE_USDT_CONTRACT)) throw new Error(`Invalid contract: ${ACTIVE_USDT_CONTRACT}`);

    const wallet = await getWalletWithKey(privateKey);
    const balance = await getAccountBalance(wallet.address);
    
    if (balance.usdt < positiveAmount) throw new Error(`Insufficient USDT: have ${balance.usdt}, need ${positiveAmount}`);
    if (balance.eth < 0.001) throw new Error(`Insufficient ETH for gas: ${balance.eth}`);

    const usdtAbi = [
      'function transfer(address to, uint256 amount) returns (bool)',
    ];
    const contract = new ethers.Contract(ACTIVE_USDT_CONTRACT, usdtAbi, wallet);
    const amountInBase = ethers.parseUnits(positiveAmount.toString(), 6); // USDT has 6 decimals

    const tx = await contract.transfer(toAddress, amountInBase);
    const receipt = await tx.wait();
    
    console.log(`[TRANSFER] ✅ txId: ${receipt?.hash}`);
    return { transactionId: receipt?.hash || '', success: true };
  } catch (e: any) {
    console.error('[TRANSFER] ❌', e?.message);
    return { transactionId: '', success: false, error: e?.message ?? 'Transfer failed' };
  }
}

/**
 * Send ETH from one address to another.
 */
export async function sendEth(
  privateKey: string,
  toAddress: string,
  amountEth: number
): Promise<{ transactionId: string; success: boolean; error?: string }> {
  try {
    console.log(`[SEND_ETH] ${amountEth} ETH → ${toAddress}`);

    if (!isValidPrivateKey(privateKey)) throw new Error('Invalid private key format');
    if (!ethers.isAddress(toAddress)) throw new Error(`Invalid recipient: ${toAddress}`);

    const wallet = await getWalletWithKey(privateKey);
    const balance = await getAccountBalance(wallet.address);
    
    if (balance.eth < amountEth) throw new Error(`Insufficient ETH: have ${balance.eth}, need ${amountEth}`);

    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: ethers.parseEther(amountEth.toString()),
    });
    
    const receipt = await tx.wait();
    console.log(`[SEND_ETH] ✅ txId: ${receipt?.hash}`);
    return { transactionId: receipt?.hash || '', success: true };
  } catch (e: any) {
    console.error('[SEND_ETH] ❌', e?.message);
    return { transactionId: '', success: false, error: e?.message ?? 'Transfer failed' };
  }
}
