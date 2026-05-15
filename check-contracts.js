const ethers = require('ethers');

(async () => {
  const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
  const contracts = [
    '0xEf54C221Fc94517877F0F40eCd71E0A3866D66C2', // App configured
    '0xAfA38f1D8cf9D2c32079A5e6358e866e827A8b0b'  // Transaction contract
  ];

  for (const addr of contracts) {
    try {
      const code = await provider.getCode(addr);
      if (code !== '0x') {
        const abi = ['function symbol() view returns (string)', 'function decimals() view returns (uint8)', 'function name() view returns (string)'];
        const contract = new ethers.Contract(addr, abi, provider);
        const symbol = await contract.symbol();
        const decimals = await contract.decimals();
        const name = await contract.name();
        console.log(`Contract ${addr}:`);
        console.log(`  Name: ${name}`);
        console.log(`  Symbol: ${symbol}`);
        console.log(`  Decimals: ${decimals}`);
      } else {
        console.log(`Contract ${addr}: No code (not a contract)`);
      }
    } catch (e) {
      console.log(`Contract ${addr}: Error - ${e.message}`);
    }
  }
})();