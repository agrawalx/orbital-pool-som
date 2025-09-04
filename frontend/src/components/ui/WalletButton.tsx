/**
 * Orbital AMM - Wallet Button Component
 * 
 * Professional wallet connection button with status indicators.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ChevronDown, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useState } from 'react';

interface WalletButtonProps {
  className?: string;
}

export function WalletButton({ className = '' }: WalletButtonProps) {
  const {
    address,
    isConnected,
    isConnecting,
    truncatedAddress,
    balance,
    currentChain,
    isSupportedChain,
    connectWallet,
    disconnect,
    switchToSupportedChain,
  } = useWallet();

  const [showDropdown, setShowDropdown] = useState(false);

  // Not connected state
  if (!isConnected) {
    return (
      <motion.button
        onClick={connectWallet}
        disabled={isConnecting}
        className={`
          flex items-center gap-2 px-6 py-3 rounded-xl font-semibold
          bg-gradient-to-r from-orange-500 to-red-600 
          hover:from-orange-600 hover:to-red-700
          text-white shadow-lg transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        whileHover={{ scale: isConnecting ? 1 : 1.02 }}
        whileTap={{ scale: isConnecting ? 1 : 0.98 }}
        style={{
          boxShadow: '0 0 20px rgba(249, 115, 22, 0.4)',
        }}
      >
        {isConnecting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Wallet className="w-5 h-5" />
        )}
        <span className="font-mono tracking-wider">
          {isConnecting ? 'CONNECTING...' : 'CONNECT WALLET'}
        </span>
      </motion.button>
    );
  }

  // Wrong network state
  if (!isSupportedChain) {
    return (
      <motion.button
        onClick={switchToSupportedChain}
        className={`
          flex items-center gap-2 px-6 py-3 rounded-xl font-semibold
          bg-gradient-to-r from-red-500 to-orange-600 
          hover:from-red-600 hover:to-orange-700
          text-white shadow-lg transition-all duration-300
          ${className}
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <AlertTriangle className="w-5 h-5" />
        <span className="font-mono tracking-wider">SWITCH NETWORK</span>
      </motion.button>
    );
  }

  // Connected state
  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={() => setShowDropdown(!showDropdown)}
        className="
          flex items-center gap-3 px-4 py-3 rounded-xl
          glass-morphism-dark border border-green-500/30
          hover:border-green-400/50 transition-all duration-300
        "
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <motion.div
            className="w-3 h-3 bg-green-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)',
            }}
          />
          <CheckCircle className="w-4 h-4 text-green-400" />
        </div>

        {/* Wallet Info */}
        <div className="text-left">
          <div className="text-sm font-mono font-bold text-green-300">
            {truncatedAddress}
          </div>
          <div className="text-xs text-green-400/70 font-mono">
            {currentChain && typeof currentChain === 'object' ? currentChain.name : 'Unknown Network'}
          </div>
        </div>

        <ChevronDown 
          className={`w-4 h-4 text-green-300 transition-transform duration-200 ${
            showDropdown ? 'rotate-180' : ''
          }`} 
        />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="
              absolute top-full right-0 mt-2 w-64
              glass-morphism-dark rounded-xl border border-green-500/20
              shadow-2xl z-50
            "
          >
            <div className="p-4 space-y-4">
              {/* Account Info */}
              <div className="space-y-2">
                <div className="text-xs text-green-400/70 font-mono uppercase tracking-wider">
                  Account
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono text-green-300">
                    {truncatedAddress}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(address || '')}
                    className="text-xs text-green-400 hover:text-green-300 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Balance */}
              <div className="space-y-2">
                <div className="text-xs text-green-400/70 font-mono uppercase tracking-wider">
                  Balance
                </div>
                <div className="text-sm font-mono text-green-300">
                  {balance}
                </div>
              </div>

              {/* Network */}
              <div className="space-y-2">
                <div className="text-xs text-green-400/70 font-mono uppercase tracking-wider">
                  Network
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-sm font-mono text-green-300">
                    {currentChain && typeof currentChain === 'object' ? currentChain.name : 'Unknown Network'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-green-500/20">
                <motion.button
                  onClick={() => {
                    disconnect();
                    setShowDropdown(false);
                  }}
                  className="
                    w-full px-3 py-2 rounded-lg
                    bg-red-500/10 hover:bg-red-500/20
                    border border-red-500/30 hover:border-red-500/50
                    text-red-400 hover:text-red-300
                    font-mono text-sm transition-all duration-200
                  "
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Disconnect Wallet
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}