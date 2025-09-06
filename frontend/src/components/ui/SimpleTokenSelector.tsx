/**
 * Simple Token Selector Component
 * 
 * A dropdown for selecting tokens without external dependencies.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { TOKENS } from '@/lib/constants';

interface SimpleTokenSelectorProps {
  selectedToken: typeof TOKENS[number];
  onSelect: (token: typeof TOKENS[number]) => void;
  excludeTokens?: typeof TOKENS[number][];
  className?: string;
}

export function SimpleTokenSelector({ 
  selectedToken, 
  onSelect, 
  excludeTokens = [],
  className = ''
}: SimpleTokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const availableTokens = TOKENS.filter(token => 
    !excludeTokens.some(excludeToken => excludeToken.symbol === token.symbol)
  );

  const handleSelect = (token: typeof TOKENS[number]) => {
    onSelect(token);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected Token Display */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/20 border border-orange-500/20 hover:border-orange-500/40 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div 
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: selectedToken.color }}
        >
          {selectedToken.symbol.charAt(0)}
        </div>
        <span className="text-white font-medium">{selectedToken.symbol}</span>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-0 right-0 bg-gray-900 border border-orange-500/20 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto"
          >
            {availableTokens.map((token) => (
              <motion.button
                key={token.symbol}
                onClick={() => handleSelect(token)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-orange-500/10 transition-colors first:rounded-t-lg last:rounded-b-lg"
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }}
              >
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: token.color }}
                >
                  {token.symbol.charAt(0)}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-white font-medium">{token.symbol}</div>
                  <div className="text-gray-400 text-xs">{token.name}</div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
