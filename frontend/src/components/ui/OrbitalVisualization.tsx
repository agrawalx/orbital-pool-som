'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Dynamic3DVisualization } from './Dynamic3DVisualization'

interface OrbitalVisualizationProps {
  className?: string
}

export function OrbitalVisualization({ className = '' }: OrbitalVisualizationProps) {
  const [show3D, setShow3D] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  // Mock liquidity data for visualization
  const liquidityPoints = [
    { token: 'USDC', amount: 1250000, angle: 0, radius: 80, color: '#f97316' },
    { token: 'USDT', amount: 980000, angle: 72, radius: 65, color: '#f59e0b' },
    { token: 'DAI', amount: 750000, angle: 144, radius: 55, color: '#eab308' },
    { token: 'FRAX', amount: 420000, angle: 216, radius: 40, color: '#ca8a04' },
    { token: 'LUSD', amount: 140000, angle: 288, radius: 25, color: '#a16207' }
  ]

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative ${className}`}
      >
        <div className="w-full h-96 flex items-center justify-center bg-gradient-to-br from-orange-500/5 to-amber-500/5 border border-orange-500/20 rounded-2xl overflow-hidden">
          {/* Central Orbital Sphere */}
          <div className="relative w-64 h-64">
          {/* Orbital rings */}
          {[1, 2, 3, 4].map((ring) => (
            <motion.div
              key={ring}
              className="absolute border border-orange-500/20 rounded-full"
              style={{
                width: `${ring * 60}px`,
                height: `${ring * 60}px`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
              animate={{ rotate: ring % 2 === 0 ? 360 : -360 }}
              transition={{ 
                duration: 20 + ring * 5, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            />
          ))}

          {/* Central core */}
          <motion.div
            className="absolute w-8 h-8 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
            animate={{ 
              scale: [1, 1.2, 1],
              boxShadow: [
                '0 0 20px rgba(249, 115, 22, 0.5)',
                '0 0 40px rgba(249, 115, 22, 0.8)',
                '0 0 20px rgba(249, 115, 22, 0.5)'
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Liquidity points orbiting */}
          {liquidityPoints.map((point, index) => (
            <motion.div
              key={point.token}
              className="absolute w-4 h-4 rounded-full border-2 border-white/50"
              style={{
                backgroundColor: point.color,
                left: '50%',
                top: '50%',
                boxShadow: `0 0 15px ${point.color}80`
              }}
              animate={isPaused ? {} : {
                rotate: 360,
                x: Math.cos((point.angle + index * 10) * Math.PI / 180) * point.radius - 8,
                y: Math.sin((point.angle + index * 10) * Math.PI / 180) * point.radius - 8
              }}
              transition={isPaused ? {} : {
                rotate: { 
                  duration: 15 + index * 2, 
                  repeat: Infinity, 
                  ease: "linear" 
                },
                x: { 
                  duration: 15 + index * 2, 
                  repeat: Infinity, 
                  ease: "linear" 
                },
                y: { 
                  duration: 15 + index * 2, 
                  repeat: Infinity, 
                  ease: "linear" 
                }
              }}
            >
              {/* Token label */}
              <motion.div
                className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-bold text-orange-200 whitespace-nowrap"
                animate={isPaused ? {} : { rotate: -360 }}
                transition={isPaused ? {} : { 
                  duration: 15 + index * 2, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
              >
                {point.token}
              </motion.div>
            </motion.div>
          ))}

          {/* Connecting orbital paths */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {liquidityPoints.map((point, index) => (
              <motion.circle
                key={`path-${point.token}`}
                cx="50%"
                cy="50%"
                r={point.radius}
                fill="none"
                stroke={point.color}
                strokeWidth="1"
                strokeOpacity="0.3"
                strokeDasharray="4 4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: index * 0.2 }}
              />
            ))}
          </svg>
          </div>

            {/* Overlay controls */}
          <div className="absolute top-4 right-4 space-y-2">
          <motion.button 
            onClick={() => setShow3D(true)}
            className="p-2 bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-300 hover:bg-orange-500/30 transition-colors text-xs font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🌌 3D View
          </motion.button>
          <motion.button 
            onClick={() => setIsPaused(!isPaused)}
            className={`p-2 border border-orange-500/30 rounded-lg transition-colors text-xs font-medium ${
              isPaused 
                ? 'bg-orange-500 text-white' 
                : 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isPaused ? '▶️ Play' : '⏸️ Pause'}
          </motion.button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 space-y-2">
          <div className="text-xs text-orange-300 font-semibold mb-2">Liquidity Distribution</div>
          {liquidityPoints.map((point) => (
            <div key={point.token} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full border border-white/30"
                style={{ backgroundColor: point.color }}
              />
              <span className="text-orange-200">{point.token}</span>
              <span className="text-orange-400/70">${(point.amount / 1000).toFixed(0)}K</span>
            </div>
          ))}
          </div>
        </div>
      </motion.div>

      {/* 3D Visualization Modal */}
      <Dynamic3DVisualization 
        isActive={show3D}
        onClose={() => setShow3D(false)}
      />
    </>
  )
}