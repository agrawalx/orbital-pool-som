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
  USDC: '0x4880dF7c01b31aEa71AEB41C1a29513598675A9B', // tokens[0]
  USDT: '0x47b5F881263668fe62eA532845DbEBba6896fF83', // tokens[1] 
  DAI: '0xD6c42FF19FC1E31fc01dbEE4115a9dE39143Fc74',  // tokens[2]
  FRAX: '0x0B96b05940972F5f27f2e4FfccD79FCaF068f7FF', // tokens[3]
  LUSD: '0xCBe8635Ca41e625588cd72007b6653Bd68cEd20B', // tokens[4]
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