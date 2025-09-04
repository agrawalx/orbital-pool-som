'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface LiquidityVisualizationProps {
  className?: string
}

export function LiquidityVisualization({ className = '' }: LiquidityVisualizationProps) {
  const liquidityData = useMemo(() => {
    // Mock liquidity data for different tokens with orbital theme colors
    return [
      { token: 'USDC', amount: 1250000, percentage: 35, color: 'rgb(251, 146, 60)' }, // orange-400
      { token: 'USDT', amount: 980000, percentage: 28, color: 'rgb(245, 158, 11)' }, // amber-500
      { token: 'DAI', amount: 750000, percentage: 21, color: 'rgb(249, 115, 22)' }, // orange-500
      { token: 'FRAX', amount: 420000, percentage: 12, color: 'rgb(234, 88, 12)' }, // orange-600
      { token: 'LUSD', amount: 140000, percentage: 4, color: 'rgb(217, 119, 6)' }, // amber-600
    ]
  }, [])

  const totalLiquidity = liquidityData.reduce((sum, item) => sum + item.amount, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-morphism-dark rounded-2xl p-6 border border-orange-500/20 ${className}`}
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-sm font-mono font-bold text-orange-300 tracking-wider flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="w-3 h-3 border border-orange-400 rounded-full"
            />
            ORBITAL LIQUIDITY POOL
          </h3>
          <div className="text-2xl font-bold text-orange-100 font-mono mt-2">
            ${(totalLiquidity / 1000000).toFixed(2)}M
          </div>
        </div>
        <div className="text-xs text-orange-400/70 font-mono bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">
          TVL
        </div>
      </div>

      {/* Circular liquidity visualization */}
      <div className="flex justify-center mb-4">
        <div className="relative w-32 h-32">
          <svg width="128" height="128" className="transform -rotate-90">
            {liquidityData.map((item, index) => {
              const radius = 56
              const circumference = 2 * Math.PI * radius
              const strokeDasharray = circumference
              const strokeDashoffset = circumference * (1 - item.percentage / 100)
              
              // Calculate rotation for each segment
              const previousPercentages = liquidityData
                .slice(0, index)
                .reduce((sum, prev) => sum + prev.percentage, 0)
              const rotation = (previousPercentages / 100) * 360

              return (
                <motion.circle
                  key={item.token}
                  cx="64"
                  cy="64"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="8"
                  strokeDasharray={`${(item.percentage / 100) * circumference} ${circumference}`}
                  strokeDashoffset="0"
                  style={{
                    transformOrigin: '64px 64px',
                    transform: `rotate(${rotation}deg)`,
                    filter: `drop-shadow(0 0 4px ${item.color}40)`
                  }}
                  initial={{ strokeDasharray: `0 ${circumference}` }}
                  animate={{ 
                    strokeDasharray: `${(item.percentage / 100) * circumference} ${circumference}` 
                  }}
                  transition={{ delay: index * 0.2, duration: 1, ease: "easeOut" }}
                />
              )
            })}
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xs font-mono text-orange-400/70">TOTAL</div>
              <motion.div 
                className="text-lg font-bold text-orange-200 font-mono"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {liquidityData.length}
              </motion.div>
              <div className="text-xs font-mono text-orange-400/70">TOKENS</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {liquidityData.map((item, index) => (
          <motion.div
            key={item.token}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between text-sm p-3 rounded-lg bg-gradient-to-r from-orange-500/5 to-amber-500/5 border border-orange-500/20 hover:border-orange-400/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="w-3 h-3 rounded-full"
                style={{ 
                  backgroundColor: item.color,
                  boxShadow: `0 0 12px ${item.color}60`
                }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
              />
              <span className="font-mono text-orange-200 font-semibold">{item.token}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-orange-300">
                ${(item.amount / 1000).toFixed(0)}K
              </span>
              <span className="font-mono text-orange-100 font-bold w-10 text-right">
                {item.percentage}%
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Activity indicator */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-orange-500/20">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
            animate={{ 
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-xs font-mono text-orange-300 font-semibold">ORBITAL TRADING ACTIVE</span>
        </div>
        <span className="text-xs font-mono text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
          24H VOL: $2.4M
        </span>
      </div>
    </motion.div>
  )
}