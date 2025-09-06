/**
 * Orbital AMM - Wallet Hook
 * 
 * Custom hook for wallet connection and state management using Ethers.js.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  connectWallet as connectEthersWallet,
  disconnectWallet,
  getWalletAddress,
  getETHBalance,
  formatAddress,
  isWalletConnected,
  switchToSomniaTestnet,
  SOMNIA_TESTNET,
} from '@/lib/ethers-provider';

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState('0.0000 STT');
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if wallet is connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum && isWalletConnected()) {
        try {
          const addr = await getWalletAddress();
          if (addr) {
            setAddress(addr);
            setIsConnected(true);
            await updateBalance(addr);
            await updateChainId();
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // Wallet disconnected
          setAddress(null);
          setIsConnected(false);
          setBalance('0.0000 ETH');
          disconnectWallet();
        } else {
          // Account changed
          setAddress(accounts[0]);
          setIsConnected(true);
          updateBalance(accounts[0]);
        }
      };

      const handleChainChanged = (chainId: string) => {
        const newChainId = parseInt(chainId, 16);
        setChainId(newChainId);
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const updateBalance = async (addr?: string) => {
    setIsBalanceLoading(true);
    try {
      const sttBalance = await getETHBalance(addr);
      // Format balance to show reasonable decimal places (4 digits)
      const formattedBalance = parseFloat(sttBalance).toFixed(4);
      setBalance(`${formattedBalance} STT`);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('0.0000 STT');
    } finally {
      setIsBalanceLoading(false);
    }
  };

  const updateChainId = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(parseInt(chainId, 16));
      } catch (error) {
        console.error('Error getting chain ID:', error);
      }
    }
  };

  const connectWallet = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const signer = await connectEthersWallet();
      if (signer) {
        const addr = await signer.getAddress();
        setAddress(addr);
        setIsConnected(true);
        await updateBalance(addr);
        await updateChainId();
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    disconnectWallet();
    setAddress(null);
    setIsConnected(false);
    setBalance('0.0000 STT');
    setChainId(null);
    setError(null);
  }, []);

  const switchToSupportedChain = useCallback(async () => {
    try {
      await switchToSomniaTestnet();
      await updateChainId();
    } catch (error: any) {
      console.error('Failed to switch network:', error);
      setError(error.message || 'Failed to switch network');
    }
  }, []);

  // Check if on supported chain
  const isSupportedChain = chainId === SOMNIA_TESTNET.chainId;
  
  // Truncate address for display
  const truncatedAddress = address ? formatAddress(address) : '';

  // Current chain info
  const currentChain = isSupportedChain
    ? {
        name: SOMNIA_TESTNET.name,
        rpcUrl: SOMNIA_TESTNET.rpcUrl,
        blockExplorer: SOMNIA_TESTNET.blockExplorer,
      }
    : null;

  return {
    // Connection state
    address,
    isConnected,
    isConnecting,
    truncatedAddress,
    error,
    
    // Balance
    balance,
    isBalanceLoading,
    
    // Chain info
    chainId,
    currentChain,
    isSupportedChain,
    
    // Actions
    connectWallet,
    disconnect,
    switchToSupportedChain,
    updateBalance: () => updateBalance(address || undefined),
  };
}