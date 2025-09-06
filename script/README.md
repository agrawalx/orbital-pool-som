# Orbital Pool Deployment Guide

This directory contains deployment scripts and utilities for the Orbital Pool AMM with 5 stable coins.

## Files Overview

- `Deploy.s.sol` - Main deployment script that deploys 5 stable coins and the Orbital Pool
- `DeploymentHelper.s.sol` - Helper functions for calculating valid k values and interacting with the pool
- `Interact.s.sol` - Example interaction script showing how to add liquidity, query state, and swap

## Prerequisites

1. **Environment Setup**
   ```bash
   # Create .env file with your private key
   echo "PRIVATE_KEY=your_private_key_here" > .env
   ```

2. **Install Dependencies**
   ```bash
   forge install
   ```

## Deployment

### 1. Deploy the Contracts

```bash
# Deploy to local anvil (for testing)
anvil # In separate terminal

# Deploy contracts
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast

# Deploy to a testnet (example: Sepolia)
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify

# Deploy to mainnet (be careful!)
forge script script/Deploy.s.sol --rpc-url $MAINNET_RPC_URL --broadcast --verify
```

### 2. Save Deployment Addresses

After deployment, the script will:
- Print all deployed contract addresses
- Save deployment details to `deployment.md`
- Output next steps for manual interaction

## Usage Examples

### Calculate Valid K Values

```bash
# Run helper script to see k calculation examples
forge script script/DeploymentHelper.s.sol
```

### Add Liquidity Manually

After deployment, you can add liquidity using foundry cast or by writing a script:

```bash
# Example: Add liquidity with cast
# 1. First approve tokens
cast send $TOKEN_0_ADDRESS "approve(address,uint256)" $POOL_ADDRESS 1000000000000000000000 --private-key $PRIVATE_KEY

# 2. Calculate valid k (use the helper or calculate manually)
# For amounts [1000, 1000, 1000, 1000, 1000] * 1e18, example k might be: 3905124837953327
# 3. Add liquidity
cast send $POOL_ADDRESS "addLiquidity(uint256,uint256[5])" 3905124837953327 "[1000000000000000000000,1000000000000000000000,1000000000000000000000,1000000000000000000000,1000000000000000000000]" --private-key $PRIVATE_KEY
```

### Query Pool State

```bash
# Get active ticks
cast call $POOL_ADDRESS "getActiveTicks()" 

# Get tick info
cast call $POOL_ADDRESS "getTickInfo(uint256)" $K_VALUE

# Get user LP shares
cast call $POOL_ADDRESS "getUserLpShares(uint256,address)" $K_VALUE $USER_ADDRESS

# Get total reserves
cast call $POOL_ADDRESS "_getTotalReserves()"
```

### Swap Tokens

```bash
# 1. Approve input token
cast send $TOKEN_0_ADDRESS "approve(address,uint256)" $POOL_ADDRESS 100000000000000000000 --private-key $PRIVATE_KEY

# 2. Execute swap (swap 100 token0 for token1, min 90 out)
cast send $POOL_ADDRESS "swap(uint256,uint256,uint256,uint256)" 0 1 100000000000000000000 90000000000000000000 --private-key $PRIVATE_KEY
```

## Contract Addresses

After deployment, update these addresses in your scripts:

### Deployed Contracts
- **Orbital Pool**: `<POOL_ADDRESS>`
- **USDC**: `<TOKEN_0_ADDRESS>`
- **USDT**: `<TOKEN_1_ADDRESS>`
- **DAI**: `<TOKEN_2_ADDRESS>`
- **TUSD**: `<TOKEN_3_ADDRESS>`
- **FRAX**: `<TOKEN_4_ADDRESS>`

## Helper Functions

The `DeploymentHelper.s.sol` provides several utility functions:

### Calculate Valid K Value
```solidity
uint256[5] memory amounts = [1000e18, 1000e18, 1000e18, 1000e18, 1000e18];
uint256 k = helper.calculateValidK(amounts);
```

### Check K Validity
```solidity
bool isValid = helper.isValidK(k, amounts);
```

### Get K Bounds
```solidity
(uint256 lower, uint256 upper, uint256 reserveConstraint) = helper.getKBounds(amounts);
```

## Important Notes

1. **K Value Calculation**: The k value must satisfy the orbital pool's mathematical constraints. Use the helper functions to ensure validity.

2. **Token Amounts**: All tokens use 18 decimals. Make sure your amounts are properly scaled.

3. **Slippage Protection**: When swapping, always set appropriate minimum output amounts to protect against slippage.

4. **Liquidity Management**: 
   - You can add liquidity to existing ticks or create new ones
   - Each tick has its own k value and reserves
   - LP shares are minted proportionally to liquidity provided

5. **Fees**: The pool charges a 0.3% swap fee (3000 basis points out of 1,000,000)

## Testing

Run the test suite to ensure everything works correctly:

```bash
forge test -vv
```

## Security Considerations

1. **Private Keys**: Never commit private keys to version control
2. **Testnet First**: Always test on testnets before mainnet deployment
3. **Verification**: Verify contracts on Etherscan after deployment
4. **Slippage**: Use appropriate slippage protection for swaps
5. **Approvals**: Be careful with token approvals, only approve necessary amounts

## Troubleshooting

### Common Issues

1. **Invalid K Value**: Ensure your k value satisfies the orbital constraints
2. **Insufficient Allowance**: Approve tokens before adding liquidity or swapping
3. **Slippage Exceeded**: Increase slippage tolerance or adjust amounts
4. **Insufficient Liquidity**: Add more liquidity to the pool before attempting large swaps

### Getting Help

Check the test files for examples of proper usage patterns and edge cases.
