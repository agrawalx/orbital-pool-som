# Orbital Pool Deployment - Quick Start

## 🚀 Deploy to Somnia Testnet

### 1. Set up environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your private key
nano .env
```

### 2. Deploy everything
```bash
# Run the deployment script
./deploy.sh
```

### 3. What gets deployed:

**5 Mock Stablecoins:**
- mUSDC (6 decimals) - Mock USD Coin
- mUSDT (6 decimals) - Mock Tether
- mDAI (18 decimals) - Mock DAI
- mFRAX (18 decimals) - Mock FRAX  
- mTUSD (18 decimals) - Mock TrueUSD

**Orbital Pool:**
- Supports all 5 stablecoins
- Uses tick-based concentrated liquidity
- Implements torus invariant for multi-dimensional AMM
- Initial liquidity provided at k = 1e18

### 4. After deployment:

1. **Note the contract addresses** from the deployment logs
2. **Update `InteractOrbital.s.sol`** with the deployed addresses
3. **Test functionality** using the interaction scripts

## 📖 Key Features

- **Concentrated Liquidity**: Provide liquidity at specific price ranges (ticks)
- **Multi-dimensional AMM**: Trade between any of the 5 stablecoins
- **Boundary Detection**: Automatic tick status updates based on reserve constraints
- **Fee Distribution**: Proportional fee sharing among liquidity providers

## 🔧 Manual Deployment Commands

If the script doesn't work, deploy manually:

```bash
# Deploy step by step
forge script src/DeployOrbital.s.sol:DeployOrbital \
    --rpc-url https://testnet.somnia.network \
    --broadcast \
    --legacy

# Verify contracts (optional)
forge verify-contract CONTRACT_ADDRESS src/orbital.sol:orbitalPool \
    --chain somnia_testnet
```

## 📚 Next Steps

1. Fund test accounts with mock tokens
2. Test swapping between different stablecoins
3. Add liquidity at different k values (ticks)
4. Monitor tick boundary transitions
5. Analyze fee accumulation patterns
