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
  ORBITAL_POOL: process.env.NEXT_PUBLIC_ORBITAL_POOL_ADDRESS || '0x0000000000000000000000000000000000000000', // Deploy contract and update this
  // Token addresses (these should match the tokens array in the orbital pool contract)
  USDC: '0xA0b86991c431C17C95E4808E3a230BD3f53A03d', // tokens[0]
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // tokens[1] 
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',  // tokens[2]
  FRAX: '0x853d955aCEf822Db058eb8505911ED77F175b99e', // tokens[3]
  LUSD: '0x5f98805A4E8be255a32880FDeC7F6728C6568bA0', // tokens[4]
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