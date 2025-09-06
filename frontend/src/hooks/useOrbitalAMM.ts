/**
 * Orbital AMM - Contract Interaction Hook
 * 
 * Custom hook for interacting with the Orbital AMM smart contract.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */
'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits, Address } from 'viem';
import { CONTRACTS } from '@/lib/wallet';
import { ORBITAL_POOL_ABI, ERC20_ABI } from '@/lib/orbital-abi';
import { useState, useCallback } from 'react';

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

export function useOrbitalAMM() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: hash, isPending: isWritePending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Read contract data with proper error handling
  const { data: totalReserves } = useReadContract({
    address: CONTRACTS.ORBITAL_POOL as Address,
    abi: ORBITAL_POOL_ABI,
    functionName: '_getTotalReserves',
    query: {
      enabled: !!address,
    },
  });

  const { data: activeTicks } = useReadContract({
    address: CONTRACTS.ORBITAL_POOL as Address,
    abi: ORBITAL_POOL_ABI,
    functionName: 'getActiveTicks',
    query: {
      enabled: !!address,
    },
  });

  const { data: swapFee } = useReadContract({
    address: CONTRACTS.ORBITAL_POOL as Address,
    abi: ORBITAL_POOL_ABI,
    functionName: 'swapFee',
  });

  // Swap function
  const swap = useCallback(
    async (tokenIn: number, tokenOut: number, amountIn: bigint, minAmountOut: bigint) => {
      if (!address) {
        setError('Wallet not connected');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        await writeContract({
          address: CONTRACTS.ORBITAL_POOL as Address,
          abi: ORBITAL_POOL_ABI,
          functionName: 'swap',
          args: [BigInt(tokenIn), BigInt(tokenOut), amountIn, minAmountOut],
        });
      } catch (error) {
        console.error('Swap error:', error);
        setError(error instanceof Error ? error.message : 'Swap failed');
      } finally {
        setIsLoading(false);
      }
    },
    [address, writeContract]
  );

  // Add liquidity function
  const addLiquidity = useCallback(
    async (k: bigint, amounts: readonly [bigint, bigint, bigint, bigint, bigint]) => {
      if (!address) {
        setError('Wallet not connected');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        await writeContract({
          address: CONTRACTS.ORBITAL_POOL as Address,
          abi: ORBITAL_POOL_ABI,
          functionName: 'addLiquidity',
          args: [k, amounts],
        });
      } catch (error) {
        console.error('Add liquidity error:', error);
        setError(error instanceof Error ? error.message : 'Add liquidity failed');
      } finally {
        setIsLoading(false);
      }
    },
    [address, writeContract]
  );

  // Remove liquidity function
  const removeLiquidity = useCallback(
    async (
      k: bigint,
      lpSharesToRemove: bigint,
      minAmountsOut: readonly [bigint, bigint, bigint, bigint, bigint]
    ) => {
      if (!address) {
        setError('Wallet not connected');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        await writeContract({
          address: CONTRACTS.ORBITAL_POOL as Address,
          abi: ORBITAL_POOL_ABI,
          functionName: 'removeLiquidity',
          args: [k, lpSharesToRemove, minAmountsOut],
        });
      } catch (error) {
        console.error('Remove liquidity error:', error);
        setError(error instanceof Error ? error.message : 'Remove liquidity failed');
      } finally {
        setIsLoading(false);
      }
    },
    [address, writeContract]
  );

  // Token approval functions
  const approveToken = useCallback(
    async (tokenAddress: Address, amount: bigint) => {
      if (!address) {
        setError('Wallet not connected');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        await writeContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [CONTRACTS.ORBITAL_POOL as Address, amount],
        });
      } catch (error) {
        console.error('Token approval error:', error);
        setError(error instanceof Error ? error.message : 'Token approval failed');
      } finally {
        setIsLoading(false);
      }
    },
    [address, writeContract]
  );

  // Get swap quote (read-only calculation)
  const getSwapQuote = useCallback(
    (tokenIn: number, tokenOut: number, amountIn: bigint) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useReadContract({
        address: CONTRACTS.ORBITAL_POOL as Address,
        abi: ORBITAL_POOL_ABI,
        functionName: '_calculateSwapOutput',
        args: [BigInt(tokenIn), BigInt(tokenOut), amountIn],
        query: {
          enabled: amountIn > 0,
        },
      });
    },
    []
  );

  // Get tick information
  const getTickInfo = useCallback(
    (k: bigint) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useReadContract({
        address: CONTRACTS.ORBITAL_POOL as Address,
        abi: ORBITAL_POOL_ABI,
        functionName: 'getTickInfo',
        args: [k],
      });
    },
    []
  );

  // Get user LP shares for a specific tick
  const getUserLpShares = useCallback(
    (k: bigint) => {
      if (!address) return { data: BigInt(0) };

      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useReadContract({
        address: CONTRACTS.ORBITAL_POOL as Address,
        abi: ORBITAL_POOL_ABI,
        functionName: 'getUserLpShares',
        args: [k, address],
      });
    },
    [address]
  );

  // Get token allowance
  const getTokenAllowance = useCallback(
    (tokenAddress: Address) => {
      if (!address) return { data: BigInt(0) };

      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, CONTRACTS.ORBITAL_POOL as Address],
      });
    },
    [address]
  );

  // Get token balance
  const getTokenBalance = useCallback(
    (tokenAddress: Address) => {
      if (!address) return { data: BigInt(0) };

      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
    },
    [address]
  );

  return {
    // State
    isLoading: isLoading || isWritePending || isConfirming,
    isConfirmed,
    error: error || writeError?.message,
    hash,

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
  };
}

// Utility functions for token amount formatting
export const parseTokenAmount = (amount: string, decimals: number): bigint => {
  try {
    return parseUnits(amount, decimals);
  } catch {
    return BigInt(0);
  }
};

export const formatTokenAmount = (amount: bigint, decimals: number): string => {
  try {
    return formatUnits(amount, decimals);
  } catch {
    return '0';
  }
};