/**
 * Orbital AMM - Status Bar Component
 * 
 * Real-time protocol status and network information display.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */
'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Wifi, Activity, Zap, Clock, TrendingUp } from 'lucide-react';

interface StatusBarProps {
  className?: string;
}

export function StatusBar({ className = '' }: StatusBarProps) {
  const [networkStatus] = useState<'online' | 'slow' | 'offline'>('online');
  const [blockNumber, setBlockNumber] = useState(18234567);
  const [gasPrice, setGasPrice] = useState(25);
  const [tps, setTps] = useState(1247);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setBlockNumber(prev => prev + Math.floor(Math.random() * 3) + 1);
      setGasPrice(prev => Math.max(15, prev + (Math.random() - 0.5) * 5));
      setTps(prev => Math.max(800, prev + (Math.random() - 0.5) * 100));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const statusColors = {
    online: 'text-green-400 border-green-400/30 bg-green-400/10',
    slow: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
    offline: 'text-red-400 border-red-400/30 bg-red-400/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 glass-morphism-dark border-b border-orange-500/20 ${className}`}
    >
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between text-xs">
          {/* Left Side - Network Status */}
          <div className="flex items-center gap-4">
            <motion.div
              className={`flex items-center gap-2 px-3 py-1 rounded-full border ${statusColors[networkStatus]}`}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                animate={{ rotate: networkStatus === 'online' ? 360 : 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Wifi className="w-3 h-3" />
              </motion.div>
              <span className="font-mono font-bold">
                {networkStatus === 'online' ? 'ARBITRUM ONLINE' : 
                 networkStatus === 'slow' ? 'NETWORK SLOW' : 'OFFLINE'}
              </span>
            </motion.div>

            <div className="flex items-center gap-1 text-orange-300/70">
              <Activity className="w-3 h-3" />
              <span className="font-mono">Block #{blockNumber.toLocaleString()}</span>
            </div>
          </div>

          {/* Center - Protocol Stats */}
          <div className="hidden md:flex items-center gap-6">
            <motion.div
              className="flex items-center gap-1 text-cyan-300/70"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Zap className="w-3 h-3" />
              <span className="font-mono">{Math.round(gasPrice)} GWEI</span>
            </motion.div>

            <div className="flex items-center gap-1 text-purple-300/70">
              <TrendingUp className="w-3 h-3" />
              <span className="font-mono">{tps.toLocaleString()} TPS</span>
            </div>

            <motion.div
              className="flex items-center gap-1 text-pink-300/70"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
              <span className="font-mono">LIVE PRICING</span>
            </motion.div>
          </div>

          {/* Right Side - Time */}
          <div className="flex items-center gap-2 text-orange-300/70">
            <Clock className="w-3 h-3" />
            <span className="font-mono">
              {new Date().toLocaleTimeString('en-US', { 
                hour12: false,
                timeZone: 'UTC'
              })} UTC
            </span>
          </div>
        </div>
      </div>

      {/* Animated Border */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent"
        animate={{ 
          width: ['0%', '100%', '0%'],
          x: ['0%', '0%', '100%']
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </motion.div>
  );
}