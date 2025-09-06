# Orbital AMM Integration Guide

## Overview

I have successfully integrated your Orbital AMM smart contract with the frontend. Here's what has been implemented:

## What's Been Integrated

### 1. Smart Contract ABI
- Created `frontend/src/lib/orbital-abi.ts` with the complete ABI for your `orbitalPool` contract
- Includes all functions: `swap`, `addLiquidity`, `removeLiquidity`, `getTickInfo`, etc.
- Includes events and error definitions

### 2. Contract Interaction Hook
- Updated `frontend/src/hooks/useOrbitalAMM.ts` to use the real contract
- Functions now call the actual smart contract methods:
  - `swap(tokenIn, tokenOut, amountIn, minAmountOut)`
  - `addLiquidity(k, amounts)` where amounts is [bigint, bigint, bigint, bigint, bigint]
  - `removeLiquidity(k, lpSharesToRemove, minAmountsOut)`
  - Token approval functions
  - Real-time quote calculations

### 3. Swap Interface Integration
- `SwapInterface.tsx` now connects to the real contract
- Real-time price quotes using `_calculateSwapOutput`
- Proper token approval flow before swapping
- Uses actual token indices (0-4) instead of addresses
- Handles loading states and transaction confirmations

### 4. Liquidity Interface Integration
- `LiquidityInterface.tsx` integrated with real contract functions
- Users can specify K values for liquidity ticks
- Supports all 5 tokens defined in the contract
- Shows real user positions from the contract
- Proper LP share calculations

### 5. Token Configuration
- Updated token addresses to match your contract's token array
- USDC (index 0), USDT (index 1), DAI (index 2), FRAX (index 3), LUSD (index 4)

## Deployment Steps

### Step 1: Deploy the Smart Contract

1. **Deploy to your chosen network:**
   ```bash
   cd c:\Users\yasha\orbital-pool-som
   forge script script/Deploy.s.sol --rpc-url <YOUR_RPC_URL> --private-key <YOUR_PRIVATE_KEY> --broadcast
   ```

2. **Note the deployed contract address** from the deployment output

### Step 2: Update Frontend Configuration

1. **Set the contract address:**
   Create a `.env.local` file in the frontend directory:
   ```
   NEXT_PUBLIC_ORBITAL_POOL_ADDRESS=<YOUR_DEPLOYED_CONTRACT_ADDRESS>
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<YOUR_WALLETCONNECT_PROJECT_ID>
   ```

2. **Or directly update the constants:**
   In `frontend/src/lib/wallet.ts`, replace the placeholder address:
   ```typescript
   ORBITAL_POOL: "0xYOUR_DEPLOYED_CONTRACT_ADDRESS"
   ```

### Step 3: Verify Token Addresses

Ensure the token addresses in `frontend/src/lib/constants.ts` match exactly with the tokens array in your deployed contract:

```solidity
// In your contract constructor:
constructor(IERC20[TOKENS_COUNT] memory _tokens) {
    tokens = _tokens; // These addresses must match the frontend constants
}
```

### Step 4: Test the Integration

1. **Install dependencies and start the frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Test the following flows:**
   - Connect wallet
   - Approve tokens for the contract
   - Add liquidity to create ticks
   - Perform swaps between tokens
   - Remove liquidity from ticks

## Key Integration Features

### Real Contract Calls
- All functions now make actual blockchain transactions
- Proper error handling for contract reverts
- Transaction confirmation waiting
- Loading states during blockchain interactions

### Token Approval Flow
- Automatic detection of insufficient allowances
- One-click approve functionality
- Proper allowance checking before swaps

### Live Data
- Real-time pool reserves from contract
- Active tick information
- User LP positions
- Swap fee rates from contract

### Error Handling
- Contract-specific error messages
- Transaction failure handling
- Network connectivity issues
- Insufficient balance/allowance warnings

## Smart Contract Functions Used

### Read Functions
- `_getTotalReserves()` - Get total reserves across all ticks
- `getActiveTicks()` - Get list of active tick K values
- `getTickInfo(k)` - Get detailed tick information
- `getUserLpShares(k, user)` - Get user's LP shares for a tick
- `_calculateSwapOutput(tokenIn, tokenOut, amountIn)` - Get swap quotes
- `swapFee()` - Get current swap fee

### Write Functions
- `swap(tokenIn, tokenOut, amountIn, minAmountOut)` - Execute swaps
- `addLiquidity(k, amounts)` - Add liquidity to a tick
- `removeLiquidity(k, lpShares, minAmountsOut)` - Remove liquidity
- `approve(spender, amount)` - Token approvals (ERC20)

## Important Notes

1. **Token Order**: The frontend uses indices 0-4 to reference tokens, matching your contract's tokens array
2. **K Values**: Users specify K values when adding liquidity - these determine the spherical constraint
3. **All 5 Tokens**: The contract expects amounts for all 5 tokens when adding liquidity
4. **Precision**: All calculations use proper decimal handling for different token decimals

## Next Steps

1. Deploy your contract and update the address
2. Test on a testnet first
3. Verify all token addresses match your deployment
4. Test the complete user flow
5. Deploy to mainnet when ready

The integration is complete and ready for testing! The frontend now fully interacts with your Orbital AMM implementation according to the Paradigm whitepaper.
