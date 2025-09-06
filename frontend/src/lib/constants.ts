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
    address: "0x35517FBbdC45Be29394dAcf18555953BCBB04Ec8", // tokens[0] in contract
    decimals: 18,
    logo: "/tokens/usdc.svg",
    color: "#2775CA",
    index: 0, // Contract token index
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0x58b12d91a1d9C84B2Ab5eEA278bC47f19Dc0b972", // tokens[1] in contract
    decimals: 18,
    logo: "/tokens/usdt.svg",
    color: "#26A17B",
    index: 1,
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0x5c01b4B48c5a7f7FF2A47eB1CF09acB11d5f8182", // tokens[2] in contract
    decimals: 18,
    logo: "/tokens/dai.svg",
    color: "#F5AC37",
    index: 2,
  },
  {
    symbol: "FRAX",
    name: "Frax",
    address: "0x414d7aac54808a954Acd902Db929CC8E3C8469Df", // tokens[3] in contract
    decimals: 18,
    logo: "/tokens/frax.svg",
    color: "#000000",
    index: 3,
  },
  {
    symbol: "LUSD",
    name: "Liquity USD",
    address: "0xc169519b792c4dB9343Bb1dA77D1E1835Bf92CD1", // tokens[4] in contract
    decimals: 18,
    logo: "/tokens/lusd.svg",
    color: "#745DDF",
    index: 4,
  },
] as const;

// Pool configuration
export const POOL_CONFIG = {
  address: "0xcc0F44fe3c9350CD8Aa2477e9EC13F673BB287A3",
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
