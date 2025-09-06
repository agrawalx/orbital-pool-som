/**
 * Orbital AMM - Contract Interaction Hook (Ethers.js)
 * 
 * Custom hook for interacting with the Orbital AMM smart contract using Ethers.js.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */
'use client';

import { useState, useCallback, useEffect } from 'react';
import { ethers, Contract } from 'ethers';
import { getProvider, getSigner, CONTRACTS } from '@/lib/ethers-provider';
import { ORBITAL_POOL_ABI, ERC20_ABI } from '@/lib/orbital-abi';
import { useWallet } from './useWallet';
import toast from 'react-hot-toast';

export interface TickInfo {
  r: bigint;
  liquidity: bigint;
  reserves: readonly [bigint, bigint, bigint, bigint, bigint];
  totalLpShares: bigint;
  status: number; // 0 = Interior, 1 = Boundary
  accruedFees: bigint;
}

export interface LiquidityPosition {
  k: string;
  lpShares: bigint;
  reserves: readonly [bigint, bigint, bigint, bigint, bigint];
  efficiency: number;
}

export function useOrbitalAMMEthers() {
  const { address, isConnected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Contract state
  const [totalReserves, setTotalReserves] = useState<readonly [bigint, bigint, bigint, bigint, bigint] | null>(null);
  const [activeTicks, setActiveTicks] = useState<readonly bigint[] | null>(null);
  const [swapFee, setSwapFee] = useState<bigint | null>(null);

  // Initialize contracts
  const getOrbitalContract = useCallback((withSigner = false) => {
    const provider = getProvider();
    const signerOrProvider = withSigner ? getSigner() || provider : provider;
    return new Contract(CONTRACTS.ORBITAL_POOL, ORBITAL_POOL_ABI, signerOrProvider);
  }, []);

  const getTokenContract = useCallback((tokenAddress: string, withSigner = false) => {
    const provider = getProvider();
    const signerOrProvider = withSigner ? getSigner() || provider : provider;
    return new Contract(tokenAddress, ERC20_ABI, signerOrProvider);
  }, []);

  // Load contract data
  const loadContractData = useCallback(async () => {
    try {
      const contract = getOrbitalContract();
      
      const [reserves, ticks, fee] = await Promise.all([
        contract._getTotalReserves(),
        contract.getActiveTicks(),
        contract.swapFee(),
      ]);

      setTotalReserves(reserves);
      setActiveTicks(ticks);
      setSwapFee(fee);
    } catch (error) {
      console.error('Error loading contract data:', error);
    }
  }, [getOrbitalContract]);

  // Load data on mount and when connected
  useEffect(() => {
    if (isConnected) {
      loadContractData();
    }
  }, [isConnected, loadContractData]);

  // Utility function to wait for transaction confirmation
  const waitForTransaction = async (txHash: string) => {
    const provider = getProvider();
    setTransactionHash(txHash);
    setIsConfirmed(false);
    
    try {
      const receipt = await provider.waitForTransaction(txHash);
      setIsConfirmed(true);
      await loadContractData(); // Refresh contract data
      return receipt;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  };

  // Swap function
  const swap = useCallback(
    async (tokenIn: number, tokenOut: number, amountIn: bigint, minAmountOut: bigint) => {
      if (!isConnected || !getSigner()) {
        setError('Wallet not connected');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const contract = getOrbitalContract(true);
        const tx = await contract.swap(BigInt(tokenIn), BigInt(tokenOut), amountIn, minAmountOut);
        
        await waitForTransaction(tx.hash);
      } catch (error: any) {
        console.error('Swap error:', error);
        setError(error.message || 'Swap failed');
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, getOrbitalContract]
  );

  // Add liquidity function
  const addLiquidity = useCallback(
    async (k: bigint, amounts: readonly [bigint, bigint, bigint, bigint, bigint]) => {
      if (!isConnected || !getSigner()) {
        setError('Wallet not connected');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const contract = getOrbitalContract(true);
        const tx = await contract.addLiquidity(k, amounts);
        
        await waitForTransaction(tx.hash);
      } catch (error: any) {
        console.error('Add liquidity error:', error);
        setError(error.message || 'Add liquidity failed');
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, getOrbitalContract]
  );

  // Remove liquidity function
  const removeLiquidity = useCallback(
    async (
      k: bigint,
      lpSharesToRemove: bigint,
      minAmountsOut: readonly [bigint, bigint, bigint, bigint, bigint]
    ) => {
      if (!isConnected || !getSigner()) {
        setError('Wallet not connected');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const contract = getOrbitalContract(true);
        const tx = await contract.removeLiquidity(k, lpSharesToRemove, minAmountsOut);
        
        await waitForTransaction(tx.hash);
      } catch (error: any) {
        console.error('Remove liquidity error:', error);
        setError(error.message || 'Remove liquidity failed');
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, getOrbitalContract]
  );

  // Token approval function
  const approveToken = useCallback(
    async (tokenAddress: string, amount: bigint) => {
      if (!isConnected || !getSigner()) {
        setError('Wallet not connected');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const tokenContract = getTokenContract(tokenAddress, true);
        const tx = await tokenContract.approve(CONTRACTS.ORBITAL_POOL, amount);
        
        await waitForTransaction(tx.hash);
      } catch (error: any) {
        console.error('Approval error:', error);
        setError(error.message || 'Token approval failed');
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, getTokenContract]
  );

  // Get swap quote (read-only calculation)
  const getSwapQuote = useCallback(
    async (tokenIn: number, tokenOut: number, amountIn: bigint): Promise<bigint | null> => {
      try {
        const contract = getOrbitalContract();
        const result = await contract._calculateSwapOutput(BigInt(tokenIn), BigInt(tokenOut), amountIn);
        return result;
      } catch (error) {
        console.error('Error getting swap quote:', error);
        return null;
      }
    },
    [getOrbitalContract]
  );

  // Get tick information
  const getTickInfo = useCallback(
    async (k: bigint): Promise<TickInfo | null> => {
      try {
        const contract = getOrbitalContract();
        const result = await contract.getTickInfo(k);
        return {
          r: result[0],
          liquidity: result[1],
          reserves: result[2],
          totalLpShares: result[3],
          status: result[4],
          accruedFees: result[5],
        };
      } catch (error) {
        console.error('Error getting tick info:', error);
        return null;
      }
    },
    [getOrbitalContract]
  );

  // Get user LP shares for a specific tick
  const getUserLpShares = useCallback(
    async (k: bigint): Promise<bigint | null> => {
      if (!address) return null;

      try {
        const contract = getOrbitalContract();
        const result = await contract.getUserLpShares(k, address);
        return result;
      } catch (error) {
        console.error('Error getting user LP shares:', error);
        return null;
      }
    },
    [address, getOrbitalContract]
  );

  // Get token allowance
  const getTokenAllowance = useCallback(
    async (tokenAddress: string): Promise<bigint | null> => {
      if (!address) return null;

      try {
        const tokenContract = getTokenContract(tokenAddress);
        const result = await tokenContract.allowance(address, CONTRACTS.ORBITAL_POOL);
        return result;
      } catch (error) {
        console.error('Error getting token allowance:', error);
        return null;
      }
    },
    [address, getTokenContract]
  );

  // Get token balance
  const getTokenBalance = useCallback(
    async (tokenAddress: string): Promise<bigint | null> => {
      if (!address) return null;

      try {
        const tokenContract = getTokenContract(tokenAddress);
        const result = await tokenContract.balanceOf(address);
        return result;
      } catch (error) {
        console.error('Error getting token balance:', error);
        return null;
      }
    },
    [address, getTokenContract]
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear transaction state
  const clearTransaction = useCallback(() => {
    setTransactionHash(null);
    setIsConfirmed(false);
  }, []);

  return {
    // State
    isLoading,
    isConfirmed,
    error,
    transactionHash,

    // Contract data
    totalReserves,
    activeTicks,
    swapFee,

    // Write functions
    swap,
    addLiquidity,
    removeLiquidity,
    approveToken,

    // Read functions
    getSwapQuote,
    getTickInfo,
    getUserLpShares,
    getTokenAllowance,
    getTokenBalance,

    // Utility functions
    clearError,
    clearTransaction,
    loadContractData,
  };
}

// Utility functions for token amount formatting
export const parseTokenAmount = (amount: string, decimals: number): bigint => {
  try {
    return ethers.parseUnits(amount, decimals);
  } catch {
    return BigInt(0);
  }
};

export const formatTokenAmount = (amount: bigint, decimals: number): string => {
  try {
    return ethers.formatUnits(amount, decimals);
  } catch {
    return '0';
  }
};
