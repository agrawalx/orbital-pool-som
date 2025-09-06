/**
 * Orbital AMM - Ethers.js Provider Configuration
 * 
 * Web3 provider setup using Ethers.js for Somnia testnet.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */

import { ethers } from 'ethers';

// Somnia testnet configuration
export const SOMNIA_TESTNET = {
  chainId: 50312,
  name: 'Somnia Testnet',
  rpcUrl: 'https://dream-rpc.somnia.network',
  blockExplorer: 'https://shannon-explorer.somnia.network',
  nativeCurrency: {
    name: 'STT',
    symbol: 'STT',
    decimals: 18,
  },
};

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

// Global provider instance
let provider: ethers.JsonRpcProvider | null = null;
let signer: ethers.JsonRpcSigner | null = null;

/**
 * Initialize the Ethers.js provider
 */
export function initializeProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(SOMNIA_TESTNET.rpcUrl, {
      chainId: SOMNIA_TESTNET.chainId,
      name: SOMNIA_TESTNET.name,
    });
  }
  return provider;
}

/**
 * Get the current provider
 */
export function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    return initializeProvider();
  }
  return provider;
}

/**
 * Connect to MetaMask and get signer
 */
export async function connectWallet(): Promise<ethers.JsonRpcSigner | null> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Create provider and signer
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    signer = await browserProvider.getSigner();
    
    // Check if we're on the correct network
    const network = await browserProvider.getNetwork();
    if (Number(network.chainId) !== SOMNIA_TESTNET.chainId) {
      await switchToSomniaTestnet();
    }
    
    return signer;
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
}

/**
 * Switch to Somnia testnet
 */
export async function switchToSomniaTestnet(): Promise<void> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${SOMNIA_TESTNET.chainId.toString(16)}` }],
    });
  } catch (switchError: any) {
    // If the network doesn't exist, add it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${SOMNIA_TESTNET.chainId.toString(16)}`,
            chainName: SOMNIA_TESTNET.name,
            nativeCurrency: SOMNIA_TESTNET.nativeCurrency,
            rpcUrls: [SOMNIA_TESTNET.rpcUrl],
            blockExplorerUrls: [SOMNIA_TESTNET.blockExplorer],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}

/**
 * Get the current signer
 */
export function getSigner(): ethers.JsonRpcSigner | null {
  return signer;
}

/**
 * Disconnect wallet
 */
export function disconnectWallet(): void {
  signer = null;
}

/**
 * Get wallet address
 */
export async function getWalletAddress(): Promise<string | null> {
  if (!signer) return null;
  return await signer.getAddress();
}

/**
 * Get STT balance
 */
export async function getSTTBalance(address?: string): Promise<string> {
  const provider = getProvider();
  const targetAddress = address || await getWalletAddress();
  
  if (!targetAddress) return '0';
  
  const balance = await provider.getBalance(targetAddress);
  return ethers.formatEther(balance);
}

/**
 * Get STT balance (alias for getSTTBalance for backward compatibility)
 */
export async function getETHBalance(address?: string): Promise<string> {
  return getSTTBalance(address);
}

/**
 * Format address for display
 */
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Check if wallet is connected
 */
export function isWalletConnected(): boolean {
  return signer !== null;
}

// Types for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
      removeListener: (event: string, callback: (accounts: string[]) => void) => void;
    };
  }
}
