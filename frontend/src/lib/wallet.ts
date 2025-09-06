/**
 * Orbital AMM - Wallet Configuration
 * 
 * Wallet connection setup using Wagmi and RainbowKit.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

// Define Somnia testnet properly
export const somniaTestnet = defineChain({
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'STT',
    symbol: 'STT',
  },
  rpcUrls: {
    default: {
      http: ['https://dream-rpc.somnia.network'],
    },
    public: {
      http: ['https://dream-rpc.somnia.network'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://shannon-explorer.somnia.network' },
  },
  testnet: true,
});

// Wallet configuration
export const config = getDefaultConfig({
  appName: 'Orbital AMM',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'orbital-amm-default-project-id',
  chains: [somniaTestnet],
  ssr: true,
});

// Contract addresses
export const CONTRACTS = {
  ORBITAL_POOL: process.env.NEXT_PUBLIC_ORBITAL_POOL_ADDRESS || '0xc8b4956D500a5bBA4316078cEf8c8EB70aEcc7cB',
  // Token addresses (these should match the tokens array in the orbital pool contract)
  USDC: '0x35517FBbdC45Be29394dAcf18555953BCBB04Ec8', // tokens[0]
  USDT: '0x58b12d91a1d9C84B2Ab5eEA278bC47f19Dc0b972', // tokens[1]
  DAI: '0x5c01b4B48c5a7f7FF2A47eB1CF09acB11d5f8182',  // tokens[2]
  FRAX: '0x414d7aac54808a954Acd902Db929CC8E3C8469Df', // tokens[3]
  LUSD: '0xc169519b792c4dB9343Bb1dA77D1E1835Bf92CD1', // tokens[4]
} as const;

// Chain configuration
export const SUPPORTED_CHAINS = {
  [somniaTestnet.id]: {
    name: 'Somnia Testnet',
    rpcUrl: 'https://dream-rpc.somnia.network',
    blockExplorer: 'https://shannon-explorer.somnia.network/',
  },
} as const;

// Default chain
export const DEFAULT_CHAIN = somniaTestnet;