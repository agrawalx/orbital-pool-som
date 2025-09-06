/**
 * Orbital AMM - Liquidity Interface
 * 
 * Interface for adding and removing liquidity to/from the Orbital Pool.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Plus, AlertCircle, Info } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TOKENS } from '@/lib/constants';
import { useOrbitalAMMEthers, parseTokenAmount, formatTokenAmount } from '@/hooks/useOrbitalAMMEthers';
import { useWallet } from '@/hooks/useWallet';
import toast from 'react-hot-toast';

export function LiquidityInterface() {
  const { isConnected } = useWallet();
  const {
    addLiquidity,
    getTokenBalance,
    getTokenAllowance,
    approveToken,
    isLoading,
    error,
    clearError,
    isConfirmed,
    clearTransaction
  } = useOrbitalAMMEthers();

  // Form state
  const [kValue, setKValue] = useState('');
  const [amounts, setAmounts] = useState(['', '', '', '', '']);
  const [balances, setBalances] = useState<(bigint | null)[]>([null, null, null, null, null]);
  const [allowances, setAllowances] = useState<(bigint | null)[]>([null, null, null, null, null]);

  // Load balances and allowances
  useEffect(() => {
    if (!isConnected) return;

    const loadData = async () => {
      try {
        const balancePromises = TOKENS.map(token => getTokenBalance(token.address));
        const allowancePromises = TOKENS.map(token => getTokenAllowance(token.address));
        
        const [newBalances, newAllowances] = await Promise.all([
          Promise.all(balancePromises),
          Promise.all(allowancePromises)
        ]);

        setBalances(newBalances);
        setAllowances(newAllowances);
      } catch (error) {
        console.error('Error loading balances:', error);
      }
    };

    loadData();
  }, [isConnected, getTokenBalance, getTokenAllowance, isConfirmed]);

  // Check which tokens need approval
  const needsApproval = useMemo(() => {
    return amounts.map((amount, index) => {
      if (!amount || !allowances[index]) return false;
      const amountBigInt = parseTokenAmount(amount, TOKENS[index].decimals);
      return allowances[index]! < amountBigInt;
    });
  }, [amounts, allowances]);

  // Check if form is valid
  const canAddLiquidity = useMemo(() => {
    if (!isConnected || !kValue) return false;
    
    // Check if at least one amount is entered
    const hasAmounts = amounts.some(amount => amount && parseFloat(amount) > 0);
    if (!hasAmounts) return false;

    // Check if all entered amounts are within balance
    for (let i = 0; i < amounts.length; i++) {
      if (amounts[i] && balances[i]) {
        const amountBigInt = parseTokenAmount(amounts[i], TOKENS[i].decimals);
        if (amountBigInt > balances[i]!) return false;
      }
    }

    // Check if no approvals are needed
    return !needsApproval.some(needs => needs);
  }, [isConnected, kValue, amounts, balances, needsApproval]);

  const handleAmountChange = (index: number, value: string) => {
    const newAmounts = [...amounts];
    newAmounts[index] = value;
    setAmounts(newAmounts);
  };

  const handleApprove = async (tokenIndex: number) => {
    if (!amounts[tokenIndex]) return;
    
    try {
      clearError();
      const amount = parseTokenAmount(amounts[tokenIndex], TOKENS[tokenIndex].decimals);
      await approveToken(TOKENS[tokenIndex].address, amount);
      toast.success(`${TOKENS[tokenIndex].symbol} approved successfully!`);
    } catch (error: any) {
      console.error('Approval error:', error);
      toast.error(`Approval failed: ${error.message}`);
    }
  };

  const handleAddLiquidity = async () => {
    if (!canAddLiquidity || !kValue) return;

    try {
      clearError();
      
      // Convert amounts to bigint array
      const amountsBigInt: [bigint, bigint, bigint, bigint, bigint] = amounts.map((amount, index) => 
        amount ? parseTokenAmount(amount, TOKENS[index].decimals) : BigInt(0)
      ) as [bigint, bigint, bigint, bigint, bigint];

      const kBigInt = BigInt(kValue);

      console.log('Adding liquidity:', {
        k: kBigInt.toString(),
        amounts: amountsBigInt.map(a => a.toString())
      });

      await addLiquidity(kBigInt, amountsBigInt);
      
      // Clear form on success
      setKValue('');
      setAmounts(['', '', '', '', '']);
      
      toast.success('Liquidity added successfully!');
    } catch (error: any) {
      console.error('Add liquidity error:', error);
      toast.error(`Failed to add liquidity: ${error.message}`);
    }
  };

  const formatBalance = (balance: bigint | null, decimals: number) => {
    if (!balance) return '0.0000';
    const formatted = formatTokenAmount(balance, decimals);
    return parseFloat(formatted).toFixed(4);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="glass-morphism-dark border border-orange-500/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Droplets className="w-5 h-5 text-orange-400" />
            Add Liquidity
          </h2>
          <div className="flex items-center gap-1 text-orange-400 text-sm">
            <Info className="w-4 h-4" />
            Orbital Pool
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </motion.div>
        )}

        {/* K Value Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            K Value (Tick Parameter)
          </label>
          <Input
            type="text"
            placeholder="Enter k value (e.g., 1000000000000000000)"
            value={kValue}
            onChange={(e) => setKValue(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-gray-400 mt-1">
            K determines the position on the orbital curve
          </p>
        </div>

        {/* Token Amount Inputs */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-medium text-gray-300">Token Amounts</h3>
          {TOKENS.map((token, index) => (
            <div key={token.symbol} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: token.color }}
                  >
                    {token.symbol[0]}
                  </div>
                  <span className="text-white font-medium">{token.symbol}</span>
                </div>
                <span className="text-xs text-gray-400">
                  Balance: {formatBalance(balances[index], token.decimals)}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="0.0"
                  value={amounts[index]}
                  onChange={(e) => handleAmountChange(index, e.target.value)}
                  className="flex-1"
                />
                {needsApproval[index] && amounts[index] && (
                  <Button
                    onClick={() => handleApprove(index)}
                    disabled={isLoading}
                    size="sm"
                    variant="outline"
                    className="whitespace-nowrap"
                  >
                    Approve
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Liquidity Button */}
        <Button
          onClick={handleAddLiquidity}
          disabled={!canAddLiquidity || isLoading}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Adding Liquidity...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Liquidity
            </div>
          )}
        </Button>

        {/* Info Box */}
        <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-orange-400 mt-0.5" />
            <div className="text-xs text-orange-300">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="space-y-1 text-orange-200">
                <li>• Choose a K value for your liquidity position</li>
                <li>• Enter amounts for tokens you want to provide</li>
                <li>• Approve tokens that need permission</li>
                <li>• Add liquidity to earn fees from swaps</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
            
            <div className="flex justify-between items-center p-3 rounded-lg bg-black/20">
              <span>Wallet Connection</span>
              <span className="text-green-400">✓ Working</span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-lg bg-black/20">
              <span>Swap Interface</span>
              <span className="text-green-400">✓ Available</span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-lg bg-black/20">
              <span>Liquidity UI</span>
              <span className="text-amber-400">⚠ In Progress</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20">
            <p className="text-xs text-orange-300">
              <strong>Note:</strong> Use the Swap interface to test the Ethers.js integration. 
              Connect your wallet to Somnia testnet and try swapping tokens!
            </p>
          </div>
        </motion.div>
      </Card>
    </div>
  );
}
