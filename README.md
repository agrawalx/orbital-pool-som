# Orbital Pool AMM

A Solidity implementation of Paradigm's Orbital AMM (Automated Market Maker) for multi-dimensional stablecoin pools. This implementation uses spherical geometry and toroidal mathematics to provide concentrated liquidity in a novel way.

## Overview

The Orbital AMM introduces a new approach to concentrated liquidity that leverages:

- **Spherical Geometry**: Reserves are constrained to lie on a sphere in n-dimensional space
- **Torus Invariant**: The core invariant maintains the sum of squared reserves across interior and boundary ticks
- **Tick Boundaries**: Concentrated liquidity positions are defined by radius (R) and plane constant (P) parameters

## Key Features

### 🎯 Concentrated Liquidity
- Multi-dimensional concentrated liquidity positions
- Efficient capital utilization through geometric constraints
- Dynamic tick boundary management

### 🔄 Advanced Swap Execution
- Torus invariant-based trade calculations
- Automatic trade segmentation for boundary crossings
- Slippage protection and fee distribution

### 📊 Mathematical Precision
- 18-decimal precision arithmetic
- Quadratic equation solvers for trade calculations
- Geometric validation for all operations

### 🛡️ Security Features
- Reentrancy protection
- Comprehensive input validation
- Geometric constraint enforcement
- Slippage protection

## Architecture

### Core Components

1. **OrbitalPool**: Main AMM contract with all trading logic
2. **Tick Management**: Concentrated liquidity position management
3. **Boundary Detection**: Automatic detection of tick boundary crossings
4. **Fee Distribution**: Proportional fee distribution to active ticks

### Data Structures

- **Tick**: Individual concentrated liquidity position
- **GlobalState**: Consolidated pool state for efficient computation
- **ConsolidatedTickData**: Aggregated data for interior and boundary ticks

## Mathematical Foundation

The implementation is based on the mathematical principles outlined in Paradigm's research:

### Torus Invariant
```
||r_interior||² + ||r_boundary||² = invariant
```

### Trade Execution
For a trade from token i to token j:
```
||r + Δeᵢ - Δ'eⱼ||² = ||r||²
```

### Boundary Conditions
```
||r + Δeᵢ||² = (P/R)²
```

For detailed mathematical explanations, see [MATHEMATICAL_IMPLEMENTATION.md](docs/MATHEMATICAL_IMPLEMENTATION.md).

## Getting Started

### Prerequisites

- Foundry (for development and testing)
- Solidity 0.8.30+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd orbital-pool-som

# Install dependencies
forge install

# Build the project
forge build
```

### Testing

```bash
# Run all tests
forge test

# Run tests with verbose output
forge test -vv

# Run specific test
forge test --match-test test_SwapExecution
```

### Deployment

```bash
# Deploy to local network
forge script script/Deploy.s.sol --rpc-url <rpc-url> --private-key <private-key>

# Deploy to testnet
forge script script/Deploy.s.sol --rpc-url <testnet-rpc> --private-key <private-key> --broadcast
```

## Usage

### Adding Liquidity

```solidity
// Approve tokens first
tokenA.approve(address(pool), amount);
tokenB.approve(address(pool), amount);
tokenC.approve(address(pool), amount);

// Add liquidity to a tick
uint256[] memory amounts = new uint256[](3);
amounts[0] = 100e18; // 100 Token A
amounts[1] = 100e18; // 100 Token B
amounts[2] = 100e18; // 100 Token C

(uint256 tickId, uint256 shares) = pool.addLiquidity(
    1000e18,  // radius
    500e18,   // plane constant
    amounts
);
```

### Executing Swaps

```solidity
// Approve input token
tokenA.approve(address(pool), amountIn);

// Execute swap
uint256 amountOut = pool.swap(
    0,        // tokenInIndex
    1,        // tokenOutIndex
    amountIn, // amountIn
    minOut    // minimum amount out
);
```

### Removing Liquidity

```solidity
uint256[] memory amounts = pool.removeLiquidity(tickId, sharesToBurn);
```

## API Reference

### Core Functions

#### `addLiquidity(uint256 radius, uint256 planeConstant, uint256[] memory amounts)`
Add liquidity to a concentrated liquidity position.

#### `removeLiquidity(uint256 tickId, uint256 sharesToBurn)`
Remove liquidity from a tick position.

#### `swap(uint256 tokenInIndex, uint256 tokenOutIndex, uint256 amountIn, uint256 minAmountOut)`
Execute a swap between two tokens.

### View Functions

#### `getPrice(uint256 tokenIndex)`
Get the current price of a token relative to others.

#### `getTickInfo(uint256 tickId)`
Get detailed information about a tick position.

#### `getGlobalState()`
Get the current global pool state.

#### `getLpShares(uint256 tickId, address provider)`
Get LP shares for a specific address in a tick.

## Testing

The project includes comprehensive tests covering:

- ✅ Basic liquidity operations
- ✅ Swap execution with torus invariant
- ✅ Boundary crossing detection
- ✅ Tick status management
- ✅ Fee distribution
- ✅ Geometric constraints
- ✅ Error handling

Run tests with:
```bash
forge test
```

## Gas Optimization

The implementation includes several gas optimizations:

1. **Consolidated Data Structures**: Efficient computation through data aggregation
2. **Early Reverts**: Invalid operations detected early
3. **Minimal Storage**: Only essential data stored on-chain
4. **Optimized Math**: Efficient mathematical operations

## Security Considerations

- **Reentrancy Protection**: All external functions protected
- **Input Validation**: Comprehensive geometric validation
- **Slippage Protection**: Minimum output amount checks
- **Precision Handling**: Careful precision management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the UNLICENSED license.

## Acknowledgments

- Paradigm Research for the Orbital AMM concept
- OpenZeppelin for security libraries
- Foundry team for the development framework

## References

- [Orbital AMM Whitepaper](https://www.paradigm.xyz/2025/06/orbital)
- [Mathematical Implementation Guide](docs/MATHEMATICAL_IMPLEMENTATION.md)
- [Foundry Documentation](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## Support

For questions and support:
- Open an issue on GitHub
- Check the documentation in the `docs/` folder
- Review the test files for usage examples
