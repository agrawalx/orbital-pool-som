/**
 * Orbital AMM - Configuration Constants
 *
 * Centralized configuration for tokens, pools, and protocol parameters.
 *
 * @author Orbital Protocol Team
 * @version 1.0.0
 */

export const TOKENS = [
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0xA0b86991c431C17C95E4808E3a230BD3f53A03d",
    decimals: 6,
    logo: "/tokens/usdc.svg",
    color: "#2775CA",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 6,
    logo: "/tokens/usdt.svg",
    color: "#26A17B",
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    decimals: 18,
    logo: "/tokens/dai.svg",
    color: "#F5AC37",
  },
  {
    symbol: "FRAX",
    name: "Frax",
    address: "0x853d955aCEf822Db058eb8505911ED77F175b99e",
    decimals: 18,
    logo: "/tokens/frax.svg",
    color: "#000000",
  },
  {
    symbol: "LUSD",
    name: "Liquity USD",
    address: "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0",
    decimals: 18,
    logo: "/tokens/lusd.svg",
    color: "#745DDF",
  },
] as const;

// Pool configuration
export const POOL_CONFIG = {
  address: "0x1234567890123456789012345678901234567890",
  fee: 0.003, // 0.3%
  maxSlippage: 0.05, // 5%
  minLiquidity: 1000,
} as const;

// UI Constants
export const ANIMATION_DURATION = 0.3;
export const DEBOUNCE_DELAY = 500;

// Orbital AMM specific constants
export const ORBITAL_CONSTANTS = {
  PRECISION: BigInt("1000000000000000000"), // 10^18
  MAX_TOKENS: 1000,
  MIN_LIQUIDITY: BigInt("1000000000000000"), // 10^15
  CONVERGENCE_TOLERANCE: BigInt("1000000"), // 10^6
  MAX_SLIPPAGE: BigInt("100000000000000000"), // 10%
} as const;

// Chart colors for different tokens
export const CHART_COLORS = [
  "#2775CA", // USDC Blue
  "#26A17B", // USDT Green
  "#F5AC37", // DAI Yellow
  "#000000", // FRAX Black
  "#745DDF", // LUSD Purple
  "#FF6B6B", // Additional colors
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
] as const;
