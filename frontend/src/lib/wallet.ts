/**
 * Orbital AMM - Wallet Configuration
 * 
 * Wallet connection setup using Wagmi and RainbowKit.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrum, arbitrumGoerli, mainnet } from 'wagmi/chains';

// Wallet configuration
export const config = getDefaultConfig({
  appName: 'Orbital AMM',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'orbital-amm-default',
  chains: [arbitrum, arbitrumGoerli, mainnet],
  ssr: true,
});

// Contract addresses
export const CONTRACTS = {
  ORBITAL_POOL: process.env.NEXT_PUBLIC_ORBITAL_POOL_ADDRESS || '0x1234567890123456789012345678901234567890',
  USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum USDC
  USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // Arbitrum USDT
  DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',  // Arbitrum DAI
} as const;

// Chain configuration
export const SUPPORTED_CHAINS = {
  [arbitrum.id]: {
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
  },
  [arbitrumGoerli.id]: {
    name: 'Arbitrum Goerli',
    rpcUrl: 'https://goerli-rollup.arbitrum.io/rpc',
    blockExplorer: 'https://goerli.arbiscan.io',
  },
} as const;

// Default chain
export const DEFAULT_CHAIN = arbitrum;