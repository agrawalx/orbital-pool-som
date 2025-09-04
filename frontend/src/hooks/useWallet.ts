/**
 * Orbital AMM - Wallet Hook
 * 
 * Custom hook for wallet connection and state management.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */
'use client';

import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { DEFAULT_CHAIN, SUPPORTED_CHAINS } from '@/lib/wallet';
import { formatUnits } from 'viem';

export function useWallet() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Get ETH balance
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address,
  });

  // Check if on supported chain
  const isSupportedChain = chainId && Object.keys(SUPPORTED_CHAINS).includes(chainId.toString());
  const currentChain = chainId && SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS];

  // Format balance for display
  const formattedBalance = balance 
    ? `${parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)} ${balance.symbol}`
    : '0.0000 ETH';

  // Connect wallet function
  const connectWallet = () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

  // Switch to supported chain
  const switchToSupportedChain = () => {
    if (switchChain) {
      switchChain({ chainId: DEFAULT_CHAIN.id });
    }
  };

  // Truncate address for display
  const truncatedAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  return {
    // Connection state
    address,
    isConnected,
    isConnecting,
    truncatedAddress,
    
    // Balance
    balance: formattedBalance,
    isBalanceLoading,
    
    // Chain info
    chainId,
    currentChain,
    isSupportedChain,
    
    // Actions
    connectWallet,
    disconnect,
    switchToSupportedChain,
    
    // Available connectors
    connectors,
  };
}