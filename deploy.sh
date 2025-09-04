#!/bin/bash

# Somnia Testnet Deployment Script
# Make sure to set up your .env file before running

echo "🚀 Deploying Orbital Pool to Somnia Testnet..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found! Please copy .env.example to .env and fill in your values."
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

# Check if PRIVATE_KEY is set
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ PRIVATE_KEY not set in .env file!"
    exit 1
fi

echo "📦 Compiling contracts..."
forge build

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed!"
    exit 1
fi

echo "🔄 Deploying to Somnia testnet..."

# Deploy with verification
forge script src/DeployOrbital.s.sol:DeployOrbital \
    --rpc-url somnia_testnet \
    --broadcast \
    --verify \
    --slow \
    --legacy

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "📝 Check the broadcast logs for contract addresses"
    echo "🔍 Verify contracts on Somnia explorer: https://testnet.somniaexplorer.com"
else
    echo "❌ Deployment failed. Try without verification:"
    echo "forge script src/DeployOrbital.s.sol:DeployOrbital --rpc-url somnia_testnet --broadcast --legacy"
fi
