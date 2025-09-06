'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpDown, ArrowDown, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { SimpleTokenSelector } from '@/components/ui/SimpleTokenSelector';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useWallet } from '@/hooks/useWallet';
import { useOrbitalAMMEthers, parseTokenAmount, formatTokenAmount } from '@/hooks/useOrbitalAMMEthers';
import { TOKENS } from '@/lib/constants';
import { CONTRACTS } from '@/lib/ethers-provider';
import toast from 'react-hot-toast';

type Token = typeof TOKENS[number];

export function SwapInterface() {
  const { isConnected, connectWallet } = useWallet();
  const {
    isLoading,
    error,
    isConfirmed,
    swap,
    getSwapQuote,
    approveToken,
    getTokenAllowance,
    getTokenBalance,
    clearError,
    clearTransaction,
  } = useOrbitalAMMEthers();

  // Swap state
  const [tokenIn, setTokenIn] = useState<Token>(TOKENS[0]);
  const [tokenOut, setTokenOut] = useState<Token>(TOKENS[1]);
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [slippage, setSlippage] = useState(0.5); // 0.5%
  const [priceImpact, setPriceImpact] = useState(0);

  // Balances and allowances
  const [tokenInBalance, setTokenInBalance] = useState<bigint | null>(null);
  const [tokenOutBalance, setTokenOutBalance] = useState<bigint | null>(null);
  const [tokenInAllowance, setTokenInAllowance] = useState<bigint | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Load balances and allowances
  useEffect(() => {
    if (!isConnected) return;

    const loadData = async () => {
      try {
        const [inBalance, outBalance, allowance] = await Promise.all([
          getTokenBalance(tokenIn.address),
          getTokenBalance(tokenOut.address),
          getTokenAllowance(tokenIn.address),
        ]);

        setTokenInBalance(inBalance);
        setTokenOutBalance(outBalance);
        setTokenInAllowance(allowance);
      } catch (error) {
        console.error('Error loading balances:', error);
      }
    };

    loadData();
  }, [isConnected, tokenIn, tokenOut, getTokenBalance, getTokenAllowance, isConfirmed]);

  // Get swap quote when amount changes
  useEffect(() => {
    if (!amountIn || parseFloat(amountIn) <= 0) {
      setAmountOut('');
      return;
    }

    const getQuote = async () => {
      setIsLoadingQuote(true);
      try {
        const amountInBigInt = parseTokenAmount(amountIn, tokenIn.decimals);
        const quote = await getSwapQuote(tokenIn.index, tokenOut.index, amountInBigInt);
        
        if (quote) {
          const formattedQuote = formatTokenAmount(quote, tokenOut.decimals);
          setAmountOut(formattedQuote);
          
          // Calculate price impact (simplified)
          const inputValue = parseFloat(amountIn);
          const outputValue = parseFloat(formattedQuote);
          const expectedOutput = inputValue; // Assuming 1:1 for stablecoins
          const impact = ((expectedOutput - outputValue) / expectedOutput) * 100;
          setPriceImpact(Math.max(0, impact));
        }
      } catch (error) {
        console.error('Error getting quote:', error);
        setAmountOut('');
      } finally {
        setIsLoadingQuote(false);
      }
    };

    const debounceTimer = setTimeout(getQuote, 500);
    return () => clearTimeout(debounceTimer);
  }, [amountIn, tokenIn, tokenOut, getSwapQuote]);

  // Check if approval is needed
  const needsApproval = useMemo(() => {
    if (!amountIn || !tokenInAllowance) return false;
    const amountInBigInt = parseTokenAmount(amountIn, tokenIn.decimals);
    return tokenInAllowance < amountInBigInt;
  }, [amountIn, tokenInAllowance, tokenIn.decimals]);

  // Validate swap
  const canSwap = useMemo(() => {
    if (!isConnected || !amountIn) return false;
    
    // Check if amount is valid
    const amount = parseFloat(amountIn);
    if (isNaN(amount) || amount <= 0) return false;
    
    // Don't require amountOut for validation - it will be calculated
    if (needsApproval) return false;
    if (!tokenInBalance) return false;
    
    const amountInBigInt = parseTokenAmount(amountIn, tokenIn.decimals);
    return tokenInBalance >= amountInBigInt;
  }, [isConnected, amountIn, needsApproval, tokenInBalance, tokenIn.decimals]);

  const handleSwapTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn(amountOut);
    setAmountOut('');
  };

  const handleApprove = async () => {
    if (!amountIn) return;
    
    try {
      clearError();
      const amountInBigInt = parseTokenAmount(amountIn, tokenIn.decimals);
      // Approve a bit more than needed to avoid frequent approvals
      const approvalAmount = amountInBigInt * BigInt(2);
      
      await approveToken(tokenIn.address, approvalAmount);
      toast.success('Token approval successful!');
    } catch (error: any) {
      toast.error(`Approval failed: ${error.message}`);
    }
  };

  const handleSwap = async () => {
    if (!canSwap || !amountIn) return;

    try {
      clearError();
      const amountInBigInt = parseTokenAmount(amountIn, tokenIn.decimals);
      
      // Set minimum amount out to 0 for now (no slippage protection)
      // In production, you'd calculate this based on slippage tolerance
      const minAmountOut = BigInt(0);

      console.log('Swapping:', {
        tokenInIndex: tokenIn.index,
        tokenOutIndex: tokenOut.index,
        amountIn: amountInBigInt.toString(),
        minAmountOut: minAmountOut.toString()
      });

      await swap(tokenIn.index, tokenOut.index, amountInBigInt, minAmountOut);
      
      // Success toast will be shown by the hook when transaction confirms
      
      // Clear form
      setAmountIn('');
      setAmountOut('');
    } catch (error: any) {
      console.error('Swap error:', error);
      toast.error(`Swap failed: ${error.message}`);
    }
  };

  // Clear transaction state when component unmounts or error changes
  useEffect(() => {
    if (isConfirmed) {
      clearTransaction();
    }
  }, [isConfirmed, clearTransaction]);

  const formatBalance = (balance: bigint | null, decimals: number) => {
    if (!balance) return '0.0000';
    const formatted = formatTokenAmount(balance, decimals);
    // Format to show up to 4 decimal places
    return parseFloat(formatted).toFixed(4);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="glass-morphism-dark border border-orange-500/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Swap</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSlippage(slippage === 0.5 ? 1.0 : 0.5)}
              className="text-orange-400"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* From Token */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">From</label>
              <span className="text-xs text-gray-500">
                Balance: {formatBalance(tokenInBalance, tokenIn.decimals)}
              </span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-black/20 border border-orange-500/10">
              <SimpleTokenSelector
                selectedToken={tokenIn}
                onSelect={setTokenIn}
                excludeTokens={[tokenOut]}
              />
              <Input
                type="number"
                placeholder="0.0"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                className="bg-transparent border-none text-right text-lg font-medium"
              />
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSwapTokens}
              className="rounded-full p-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20"
            >
              <ArrowUpDown className="w-4 h-4 text-orange-400" />
            </Button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">To</label>
              <span className="text-xs text-gray-500">
                Balance: {formatBalance(tokenOutBalance, tokenOut.decimals)}
              </span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-black/20 border border-orange-500/10">
              <SimpleTokenSelector
                selectedToken={tokenOut}
                onSelect={setTokenOut}
                excludeTokens={[tokenIn]}
              />
              <div className="flex-1 text-right">
                {isLoadingQuote ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <span className="text-lg font-medium text-white">
                    {amountOut || '0.0'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Price Impact & Slippage */}
          {amountOut && (
            <div className="space-y-2 p-3 rounded-lg bg-black/10">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Price Impact</span>
                <span className={priceImpact > 5 ? 'text-red-400' : 'text-gray-300'}>
                  {priceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Max Slippage</span>
                <span className="text-gray-300">{slippage}%</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
            >
              <p className="text-red-400 text-sm">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="mt-2 text-red-400 hover:text-red-300"
              >
                Dismiss
              </Button>
            </motion.div>
          )}

          {/* Action Button */}
          <div className="pt-4">
            {!isConnected ? (
              <Button onClick={connectWallet} className="w-full">
                Connect Wallet
              </Button>
            ) : needsApproval ? (
              <Button
                onClick={handleApprove}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  `Approve ${tokenIn.symbol}`
                )}
              </Button>
            ) : (
              <Button
                onClick={handleSwap}
                disabled={!canSwap || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : !amountIn ? (
                  'Enter Amount'
                ) : !tokenInBalance || parseTokenAmount(amountIn, tokenIn.decimals) > tokenInBalance ? (
                  `Insufficient ${tokenIn.symbol}`
                ) : (
                  'Swap'
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
