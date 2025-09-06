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
    address: "0x4880dF7c01b31aEa71AEB41C1a29513598675A9B", // tokens[0] in contract
    decimals: 18,
    logo: "/tokens/usdc.svg",
    color: "#2775CA",
    index: 0, // Contract token index
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0x47b5F881263668fe62eA532845DbEBba6896fF83", // tokens[1] in contract
    decimals: 18,
    logo: "/tokens/usdt.svg",
    color: "#26A17B",
    index: 1,
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0xD6c42FF19FC1E31fc01dbEE4115a9dE39143Fc74", // tokens[2] in contract
    decimals: 18,
    logo: "/tokens/dai.svg",
    color: "#F5AC37",
    index: 2,
  },
  {
    symbol: "FRAX",
    name: "Frax",
    address: "0x0B96b05940972F5f27f2e4FfccD79FCaF068f7FF", // tokens[3] in contract
    decimals: 18,
    logo: "/tokens/frax.svg",
    color: "#000000",
    index: 3,
  },
  {
    symbol: "LUSD",
    name: "Liquity USD",
    address: "0xCBe8635Ca41e625588cd72007b6653Bd68cEd20B", // tokens[4] in contract
    decimals: 18,
    logo: "/tokens/lusd.svg",
    color: "#745DDF",
    index: 4,
  },
] as const;

// Pool configuration
export const POOL_CONFIG = {
  address: "0x0bb910695e728149Ae3A52f186E972bC295d7a26",
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
