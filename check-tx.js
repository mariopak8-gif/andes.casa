const ethers = require('ethers');

(async () => {
  const txHash = '0xb8ed54bb038c1b59df1ffdaa6f7cae5f206b49ec99731dbf776676ab539642a0';

  // Check Arbitrum Sepolia
  try {
    const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
    const tx = await provider.getTransaction(txHash);
    if (tx) {
      console.log('✅ FOUND on Arbitrum Sepolia:');
      console.log('From:', tx.from);
      console.log('To:', tx.to);
      console.log('Value:', ethers.formatEther(tx.value));
      console.log('Data:', tx.data);
      const receipt = await provider.getTransactionReceipt(txHash);
      if (receipt) {
        console.log('Status:', receipt.status);
        console.log('Block:', receipt.blockNumber);
      }

      // Check if the "To" address is a contract (likely USDT)
      const contractAddress = tx.to;
      const code = await provider.getCode(contractAddress);
      if (code !== '0x') {
        console.log('To address is a contract - checking token details...');
        const abi = ['function symbol() view returns (string)', 'function decimals() view returns (uint8)'];
        const contract = new ethers.Contract(contractAddress, abi, provider);
        try {
          const symbol = await contract.symbol();
          const decimals = await contract.decimals();
          console.log('Token Symbol:', symbol);
          console.log('Token Decimals:', decimals);

          // Decode the transfer data
          if (tx.data.startsWith('0xa9059cbb')) {
            const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['address', 'uint256'], '0x' + tx.data.slice(10));
            const recipient = decoded[0];
            const amount = decoded[1];
            console.log('Transfer Recipient:', recipient);
            console.log('Transfer Amount (raw):', amount.toString());
            console.log('Transfer Amount (formatted):', ethers.formatUnits(amount, decimals), symbol);
          }
        } catch (e) {
          console.log('Could not get token details:', e.message);
        }
      }
    } else {
      console.log('❌ Not found on Arbitrum Sepolia');
    }
  } catch (e) {
    console.error('Arbitrum Sepolia error:', e.message);
  }

  // Check Arbitrum Mainnet
  try {
    const provider = new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
    const tx = await provider.getTransaction(txHash);
    if (tx) {
      console.log('✅ FOUND on Arbitrum Mainnet:');
      console.log('From:', tx.from);
      console.log('To:', tx.to);
      console.log('Value:', ethers.formatEther(tx.value));
      console.log('Data:', tx.data);
      const receipt = await provider.getTransactionReceipt(txHash);
      if (receipt) {
        console.log('Status:', receipt.status);
        console.log('Block:', receipt.blockNumber);
      }
    } else {
      console.log('❌ Not found on Arbitrum Mainnet');
    }
  } catch (e) {
    console.error('Arbitrum Mainnet error:', e.message);
  }

  // Check Ethereum Sepolia (if accessible)
  try {
    const provider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
    const tx = await provider.getTransaction(txHash);
    if (tx) {
      console.log('✅ FOUND on Ethereum Sepolia:');
      console.log('From:', tx.from);
      console.log('To:', tx.to);
      console.log('Value:', ethers.formatEther(tx.value));
      console.log('Data:', tx.data);
      const receipt = await provider.getTransactionReceipt(txHash);
      if (receipt) {
        console.log('Status:', receipt.status);
        console.log('Block:', receipt.blockNumber);
      }
    } else {
      console.log('❌ Not found on Ethereum Sepolia');
    }
  } catch (e) {
    console.error('Ethereum Sepolia error:', e.message);
  }

})();