'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface PriceChartProps {
  data?: Array<{ time: string; price: number }>
  className?: string
}

export function PriceChart({ data, className = '' }: PriceChartProps) {
  // Mock data if none provided
  const chartData = useMemo(() => {
    if (data) return data
    
    // Generate some mock price data
    const mockData = []
    const basePrice = 1.0
    let currentPrice = basePrice
    
    for (let i = 0; i < 24; i++) {
      const change = (Math.random() - 0.5) * 0.02 // ±1% change
      currentPrice = Math.max(0.95, Math.min(1.05, currentPrice + change))
      mockData.push({
        time: `${i}:00`,
        price: currentPrice
      })
    }
    
    return mockData
  }, [data])

  const { minPrice, maxPrice, pathData } = useMemo(() => {
    if (!chartData.length) return { minPrice: 0, maxPrice: 1, pathData: '' }
    
    const prices = chartData.map(d => d.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 0.01
    
    const width = 300
    const height = 100
    const padding = 10
    
    const points = chartData.map((d, i) => {
      const x = padding + (i / (chartData.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((d.price - min) / range) * (height - 2 * padding)
      return `${x},${y}`
    })
    
    const path = `M ${points.join(' L ')}`
    
    return {
      minPrice: min,
      maxPrice: max,
      pathData: path
    }
  }, [chartData])

  const currentPrice = chartData[chartData.length - 1]?.price || 1
  const priceChange = chartData.length > 1 
    ? ((currentPrice - chartData[0].price) / chartData[0].price) * 100 
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`chart-container p-4 ${className}`}
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm font-mono font-bold text-blue-300 tracking-wider">
            PRICE CHART
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg font-bold text-white font-mono">
              ${currentPrice.toFixed(4)}
            </span>
            <span className={`text-sm font-mono ${
              priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-400 font-mono">24H</div>
      </div>
      
      <div className="relative">
        <svg
          width="100%"
          height="100"
          viewBox="0 0 300 100"
          className="chart-animate-in"
        >
          {/* Grid lines */}
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Horizontal grid lines */}
          {[0.25, 0.5, 0.75].map((ratio, i) => (
            <line
              key={i}
              x1="10"
              y1={10 + ratio * 80}
              x2="290"
              y2={10 + ratio * 80}
              className="chart-grid"
            />
          ))}
          
          {/* Area under curve */}
          <motion.path
            d={`${pathData} L 290,90 L 10,90 Z`}
            className="chart-area"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          />
          
          {/* Price line */}
          <motion.path
            d={pathData}
            fill="none"
            stroke="rgb(59, 130, 246)"
            className="chart-line"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          
          {/* Data points */}
          {chartData.map((d, i) => {
            const x = 10 + (i / (chartData.length - 1)) * 280
            const y = 90 - ((d.price - minPrice) / (maxPrice - minPrice || 0.01)) * 80
            
            return (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                r="2"
                className="chart-point"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 * i, duration: 0.3 }}
              />
            )
          })}
        </svg>
        
        {/* Pulse indicator for latest price */}
        <motion.div
          className="absolute top-2 right-2 w-2 h-2 bg-blue-400 rounded-full chart-pulse"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-400 font-mono mt-2">
        <span>00:00</span>
        <span>12:00</span>
        <span>24:00</span>
      </div>
    </motion.div>
  )
}