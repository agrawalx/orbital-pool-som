/**
 * Orbital AMM - Wallet Configuration
 * 
 * Wallet connection setup using Wagmi and RainbowKit.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {somniaTestnet } from 'wagmi/chains';

// Wallet configuration
export const config = getDefaultConfig({
  appName: 'Orbital AMM',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'orbital-amm-default',
  chains: [somniaTestnet],
  ssr: true,
});

// Contract addresses
export const CONTRACTS = {
  ORBITAL_POOL: process.env.NEXT_PUBLIC_ORBITAL_POOL_ADDRESS || '0xc8b4956D500a5bBA4316078cEf8c8EB70aEcc7cB', // Deploy contract and update this
  // Token addresses (these should match the tokens array in the orbital pool contract)
  USDC: '0xc33b62e90A925AF4D2307772825F0D57333397Dc ', // tokens[0]
  USDT: '0x277FaC9F3d179f5E03d1E762B2b56b72df19E878', // tokens[1] 
  DAI: '0xB5000814f05343EAD29238e152E0c36e591139b3',  // tokens[2]
  FRAX: '0x9E677cCAADB74D17c171457dF1141B4c769F4D08', // tokens[3]
  LUSD: '0x9E677cCAADB74D17c171457dF1141B4c769F4D08', // tokens[4]
} as const;

// Chain configuration
export const SUPPORTED_CHAINS = {
  [somniaTestnet.id]:{
    name: 'Somnia Testnet',
    rpcUrl: 'https://dream-rpc.somnia.network',
    blockExplorer: 'https://shannon-explorer.somnia.network/',
  },
} as const;

// Default chain
export const DEFAULT_CHAIN = somniaTestnet;