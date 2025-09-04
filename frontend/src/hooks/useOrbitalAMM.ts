/**
 * Orbital AMM - Contract Interaction Hook
 * 
 * Custom hook for interacting with the Orbital AMM smart contract.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */
'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { CONTRACTS } from '@/lib/wallet';
import { useState } from 'react';

// Simplified ABI for demo purposes
const ORBITAL_AMM_ABI = [
  {
    name: 'swap',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'minAmountOut', type: 'uint256' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    name: 'addLiquidity',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'amountA', type: 'uint256' },
      { name: 'amountB', type: 'uint256' },
    ],
    outputs: [{ name: 'liquidity', type: 'uint256' }],
  },
  {
    name: 'getAmountOut',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    name: 'getPoolInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
    ],
    outputs: [
      { name: 'reserveA', type: 'uint256' },
      { name: 'reserveB', type: 'uint256' },
      { name: 'totalLiquidity', type: 'uint256' },
    ],
  },
] as const;

export function useOrbitalAMM() {
  const [isLoading, setIsLoading] = useState(false);
  const { writeContract, data: hash, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Get quote for swap
  const useSwapQuote = (amountIn: string, tokenIn: string, tokenOut: string) => {
    const { data: amountOut, isLoading: isQuoteLoading } = useReadContract({
      address: CONTRACTS.ORBITAL_POOL as `0x${string}`,
      abi: ORBITAL_AMM_ABI,
      functionName: 'getAmountOut',
      args: [
        parseUnits(amountIn || '0', 18),
        tokenIn as `0x${string}`,
        tokenOut as `0x${string}`,
      ],
      query: {
        enabled: !!amountIn && !!tokenIn && !!tokenOut && parseFloat(amountIn) > 0,
      },
    });

    return {
      amountOut: amountOut ? formatUnits(amountOut, 18) : '0',
      isLoading: isQuoteLoading,
    };
  };

  // Get pool information
  const usePoolInfo = (tokenA: string, tokenB: string) => {
    const { data: poolData, isLoading: isPoolLoading } = useReadContract({
      address: CONTRACTS.ORBITAL_POOL as `0x${string}`,
      abi: ORBITAL_AMM_ABI,
      functionName: 'getPoolInfo',
      args: [tokenA as `0x${string}`, tokenB as `0x${string}`],
      query: {
        enabled: !!tokenA && !!tokenB,
      },
    });

    return {
      reserveA: poolData ? formatUnits(poolData[0], 18) : '0',
      reserveB: poolData ? formatUnits(poolData[1], 18) : '0',
      totalLiquidity: poolData ? formatUnits(poolData[2], 18) : '0',
      isLoading: isPoolLoading,
    };
  };

  // Execute swap
  const executeSwap = async (
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    minAmountOut: string
  ) => {
    try {
      setIsLoading(true);
      await writeContract({
        address: CONTRACTS.ORBITAL_POOL as `0x${string}`,
        abi: ORBITAL_AMM_ABI,
        functionName: 'swap',
        args: [
          tokenIn as `0x${string}`,
          tokenOut as `0x${string}`,
          parseUnits(amountIn, 18),
          parseUnits(minAmountOut, 18),
        ],
      });
    } catch (err) {
      console.error('Swap failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Add liquidity
  const addLiquidity = async (
    tokenA: string,
    tokenB: string,
    amountA: string,
    amountB: string
  ) => {
    try {
      setIsLoading(true);
      await writeContract({
        address: CONTRACTS.ORBITAL_POOL as `0x${string}`,
        abi: ORBITAL_AMM_ABI,
        functionName: 'addLiquidity',
        args: [
          tokenA as `0x${string}`,
          tokenB as `0x${string}`,
          parseUnits(amountA, 18),
          parseUnits(amountB, 18),
        ],
      });
    } catch (err) {
      console.error('Add liquidity failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Hooks
    useSwapQuote,
    usePoolInfo,
    // Actions
    executeSwap,
    addLiquidity,
    // Transaction state
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    hash,
  };
}