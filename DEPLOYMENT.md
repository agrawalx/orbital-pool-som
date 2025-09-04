# Orbital Pool Deployment Guide - Somnia Testnet

## Prerequisites

1. **Install Foundry** (if not already installed):
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. **Set up environment variables**:
Create a `.env` file in the project root:
```bash
# Your private key for deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Optional: Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Somnia testnet RPC URL (backup if the default doesn't work)
SOMNIA_TESTNET_RPC=https://testnet.somnia.network
```

3. **Get Somnia testnet tokens**:
- Visit the Somnia testnet faucet
- Get test ETH for gas fees

## Deployment Steps

### 1. Compile Contracts
```bash
forge build
```

### 2. Deploy to Somnia Testnet
```bash
forge script src/DeployOrbital.s.sol:DeployOrbital \
    --rpc-url somnia_testnet \
    --broadcast \
    --verify \
    --slow
```

### 3. Alternative deployment without verification:
```bash
forge script src/DeployOrbital.s.sol:DeployOrbital \
    --rpc-url somnia_testnet \
    --broadcast
```

## What Gets Deployed

1. **5 Mock USD Stablecoins**:
   - mUSDC (Mock USD Coin) - 6 decimals
   - mUSDT (Mock Tether USD) - 6 decimals  
   - mDAI (Mock DAI Stablecoin) - 18 decimals
   - mFRAX (Mock FRAX) - 18 decimals
   - mTUSD (Mock TrueUSD) - 18 decimals

2. **Orbital Pool Contract**:
   - Configured for the 5 deployed stablecoins
   - Initial liquidity added at k = 1e18
   - Ready for swapping and additional liquidity provision

## Post-Deployment Testing

### 1. Fund test accounts (optional):
```bash
forge script src/DeployOrbital.s.sol:DeployOrbital \
    --rpc-url somnia_testnet \
    --sig "fundTestAccounts(address[],address[])" \
    "[0xTEST_ACCOUNT_1,0xTEST_ACCOUNT_2]" \
    "[TOKEN_1_ADDRESS,TOKEN_2_ADDRESS,TOKEN_3_ADDRESS,TOKEN_4_ADDRESS,TOKEN_5_ADDRESS]" \
    --broadcast
```

### 2. Test swapping:
Use the deployed contract addresses to interact with the pool through a frontend or direct contract calls.

### 3. Monitor tick behavior:
Check how ticks transition between Interior and Boundary status as trades occur.

## Troubleshooting

- **Insufficient gas**: Increase gas limit in the script or use `--slow` flag
- **RPC issues**: Try alternative RPC endpoint or check network status
- **Verification fails**: Run verification separately after deployment
- **Out of funds**: Ensure sufficient testnet ETH balance

## Contract Verification (Manual)

If automatic verification fails, verify manually:

```bash
forge verify-contract \
    --chain somnia_testnet \
    --compiler-version 0.8.30 \
    CONTRACT_ADDRESS \
    src/orbital.sol:orbitalPool
```

## Security Notes

- These are mock tokens for testing only
- Do not use on mainnet without proper auditing
- Private keys should never be committed to version control
- Consider using hardware wallets for production deployments
