/**
 * Orbital AMM - Advanced Chart Component
 * 
 * Professional analytics dashboard with multiple chart types and real-time data visualization.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */
'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine, ComposedChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Zap, BarChart3, PieChart } from 'lucide-react';

interface ChartData {
  timestamp: string
  time: string
  price: number
  volume: number
  liquidity: number
  efficiency: number
  fees: number
  apy: number
  trades: number
}

interface AdvancedChartProps {
  className?: string
  title?: string
  showMetricSelector?: boolean
}

export function AdvancedChart({ 
  className = '', 
  title = 'Orbital AMM Analytics',
  showMetricSelector = true 
}: AdvancedChartProps) {
  const [activeMetric, setActiveMetric] = useState<'price' | 'volume' | 'liquidity' | 'efficiency' | 'apy' | 'fees'>('liquidity')
  const [timeframe, setTimeframe] = useState<'1H' | '4H' | '1D' | '1W'>('1D')
  const [chartType, setChartType] = useState<'area' | 'line' | 'composed'>('area')

  // Generate realistic hardcoded data for the last 24 hours
  const generateRealisticData = useMemo(() => {
    const now = new Date()
    const data: ChartData[] = []
    
    // Base values for realistic progression
    let baseLiquidity = 3750000 // $3.75M starting liquidity
    const basePrice = 1.0002 // Slightly above peg for stablecoin pair
    const baseVolume = 450000 // $450K base volume
    const baseEfficiency = 2.8 // Starting efficiency
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
      
      // Add realistic market movements
      const timeOfDay = timestamp.getHours()
      const isBusinessHours = timeOfDay >= 8 && timeOfDay <= 20
      const volumeMultiplier = isBusinessHours ? 1.2 + Math.random() * 0.8 : 0.6 + Math.random() * 0.4
      
      // Price oscillation around peg (realistic for stablecoin AMM)
      const priceVariation = (Math.sin(i * 0.3) + Math.random() * 0.4 - 0.2) * 0.0008
      const currentPrice = basePrice + priceVariation
      
      // Volume with realistic patterns
      const volumeVariation = (Math.random() - 0.5) * 0.4
      const currentVolume = baseVolume * volumeMultiplier * (1 + volumeVariation)
      
      // Liquidity grows with successful trades
      const liquidityGrowth = currentVolume * 0.002 // Small growth from fees
      baseLiquidity += liquidityGrowth + (Math.random() - 0.5) * 50000
      
      // Efficiency correlates with volume and liquidity utilization
      const utilizationRate = currentVolume / baseLiquidity
      const efficiencyVariation = utilizationRate * 2 + Math.random() * 0.5
      const currentEfficiency = Math.max(1.5, Math.min(5.0, baseEfficiency + efficiencyVariation))
      
      // Fees based on volume (0.3% fee tier)
      const currentFees = currentVolume * 0.003
      
      // APY calculation based on fees and liquidity
      const dailyFees = currentFees
      const annualizedFees = dailyFees * 365
      const currentAPY = (annualizedFees / baseLiquidity) * 100
      
      // Number of trades (realistic distribution)
      const currentTrades = Math.floor(currentVolume / (2000 + Math.random() * 3000))
      
      data.push({
        timestamp: timestamp.toISOString(),
        time: timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        price: Number(currentPrice.toFixed(6)),
        volume: Math.floor(currentVolume),
        liquidity: Math.floor(baseLiquidity),
        efficiency: Number(currentEfficiency.toFixed(2)),
        fees: Math.floor(currentFees),
        apy: Number(currentAPY.toFixed(2)),
        trades: currentTrades
      })
    }
    
    return data
  }, [timeframe])

  const metrics = [
    { key: 'liquidity', label: 'Total Liquidity', icon: TrendingUp, color: '#f97316', suffix: '' },
    { key: 'volume', label: 'Trading Volume', icon: Activity, color: '#22c55e', suffix: '' },
    { key: 'efficiency', label: 'Capital Efficiency', icon: Zap, color: '#8b5cf6', suffix: 'x' },
    { key: 'apy', label: 'Current APY', icon: TrendingUp, color: '#06b6d4', suffix: '%' },
    { key: 'fees', label: 'Fees Earned', icon: BarChart3, color: '#f59e0b', suffix: '' },
    { key: 'price', label: 'Price Impact', icon: PieChart, color: '#ef4444', suffix: '' }
  ] as const

  const currentMetric = metrics.find(m => m.key === activeMetric)!
  
  const chartData = useMemo(() => {
    return generateRealisticData.map(item => ({
      ...item,
      displayValue: item[activeMetric]
    }))
  }, [generateRealisticData, activeMetric])

  const stats = useMemo(() => {
    if (generateRealisticData.length === 0) return { current: 0, change: 0, changePercent: 0, high: 0, low: 0, average: 0 }
    
    const values = generateRealisticData.map(item => item[activeMetric])
    const current = values[values.length - 1]
    const previous = values[values.length - 2] || current
    const change = current - previous
    const changePercent = previous !== 0 ? (change / previous) * 100 : 0
    const high = Math.max(...values)
    const low = Math.min(...values)
    const average = values.reduce((sum, val) => sum + val, 0) / values.length
    
    return { current, change, changePercent, high, low, average }
  }, [generateRealisticData, activeMetric])

  const formatValue = (value: number, metric?: string) => {
    const targetMetric = metric || activeMetric
    switch (targetMetric) {
      case 'price':
        return `$${value.toFixed(6)}`
      case 'volume':
      case 'liquidity':
      case 'fees':
        if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
        return `$${value.toFixed(0)}`
      case 'efficiency':
        return `${value.toFixed(2)}x`
      case 'apy':
        return `${value.toFixed(2)}%`
      case 'trades':
        return value.toString()
      default:
        return value.toString()
    }
  }

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    switch (chartType) {
      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(249, 115, 22, 0.1)" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 11, fill: '#fb923c' }}
              axisLine={{ stroke: '#fb923c', strokeOpacity: 0.3 }}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 11, fill: '#fb923c' }}
              axisLine={{ stroke: '#fb923c', strokeOpacity: 0.3 }}
              tickFormatter={(value) => formatValue(value)}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              tick={{ fontSize: 11, fill: '#22c55e' }}
              axisLine={{ stroke: '#22c55e', strokeOpacity: 0.3 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                borderRadius: '12px',
                color: '#fb923c',
                backdropFilter: 'blur(10px)'
              }}
              formatter={(value: number, name: string) => [
                formatValue(value, name === 'displayValue' ? activeMetric : name), 
                name === 'displayValue' ? currentMetric.label : name
              ]}
              labelStyle={{ color: '#fb923c' }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="displayValue"
              fill="url(#chartGradient)"
              stroke={currentMetric.color}
              strokeWidth={2}
              fillOpacity={0.3}
            />
            <Bar 
              yAxisId="right" 
              dataKey="trades" 
              fill="#22c55e" 
              fillOpacity={0.6}
              radius={[2, 2, 0, 0]}
            />
          </ComposedChart>
        )
      
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(249, 115, 22, 0.1)" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 11, fill: '#fb923c' }}
              axisLine={{ stroke: '#fb923c', strokeOpacity: 0.3 }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#fb923c' }}
              axisLine={{ stroke: '#fb923c', strokeOpacity: 0.3 }}
              tickFormatter={(value) => formatValue(value)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                borderRadius: '12px',
                color: '#fb923c',
                backdropFilter: 'blur(10px)'
              }}
              formatter={(value: number) => [formatValue(value), currentMetric.label]}
              labelStyle={{ color: '#fb923c' }}
            />
            <Line
              type="monotone"
              dataKey="displayValue"
              stroke={currentMetric.color}
              strokeWidth={3}
              dot={{ fill: currentMetric.color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: currentMetric.color, strokeWidth: 2, fill: '#fff' }}
            />
            <ReferenceLine 
              y={stats.average} 
              stroke={currentMetric.color} 
              strokeDasharray="5 5" 
              strokeOpacity={0.5}
              label={{ value: "Avg", fill: currentMetric.color }}
            />
          </LineChart>
        )
      
      default: // area
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={currentMetric.color} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={currentMetric.color} stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(249, 115, 22, 0.1)" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 11, fill: '#fb923c' }}
              axisLine={{ stroke: '#fb923c', strokeOpacity: 0.3 }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#fb923c' }}
              axisLine={{ stroke: '#fb923c', strokeOpacity: 0.3 }}
              tickFormatter={(value) => formatValue(value)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                borderRadius: '12px',
                color: '#fb923c',
                backdropFilter: 'blur(10px)'
              }}
              formatter={(value: number) => [formatValue(value), currentMetric.label]}
              labelStyle={{ color: '#fb923c' }}
            />
            <Area
              type="monotone"
              dataKey="displayValue"
              stroke={currentMetric.color}
              strokeWidth={2}
              fill="url(#chartGradient)"
              dot={{ fill: currentMetric.color, strokeWidth: 2, r: 3 }}
              activeDot={{ r: 6, stroke: currentMetric.color, strokeWidth: 2, fill: '#fff' }}
            />
            <ReferenceLine 
              y={stats.current} 
              stroke={currentMetric.color} 
              strokeDasharray="5 5" 
              strokeOpacity={0.7}
              label={{ value: "Current", fill: currentMetric.color }}
            />
          </AreaChart>
        )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-morphism-dark rounded-2xl p-6 border border-orange-500/20 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-orange-300 flex items-center gap-2 mb-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <currentMetric.icon className="w-5 h-5" style={{ color: currentMetric.color }} />
            </motion.div>
            {title}
          </h3>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-lg p-3">
              <div className="text-xs text-orange-400/70 mb-1">Current</div>
              <div className="text-lg font-bold text-orange-100">
                {formatValue(stats.current)}{currentMetric.suffix}
              </div>
              <div className={`flex items-center gap-1 text-xs ${
                stats.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {stats.changePercent >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{Math.abs(stats.changePercent).toFixed(2)}%</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-3">
              <div className="text-xs text-green-400/70 mb-1">24h High</div>
              <div className="text-lg font-bold text-green-100">
                {formatValue(stats.high)}{currentMetric.suffix}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="text-xs text-red-400/70 mb-1">24h Low</div>
              <div className="text-lg font-bold text-red-100">
                {formatValue(stats.low)}{currentMetric.suffix}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="text-xs text-blue-400/70 mb-1">Average</div>
              <div className="text-lg font-bold text-blue-100">
                {formatValue(stats.average)}{currentMetric.suffix}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3">
          {/* Chart Type Selector */}
          <div className="flex gap-1 bg-black/20 rounded-lg p-1">
            {(['area', 'line', 'composed'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors capitalize ${
                  chartType === type
                    ? 'bg-orange-500 text-white'
                    : 'text-orange-300 hover:bg-orange-500/20'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          
          {/* Timeframe Selector */}
          <div className="flex gap-1 bg-black/20 rounded-lg p-1">
            {(['1H', '4H', '1D', '1W'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  timeframe === tf
                    ? 'bg-orange-500 text-white'
                    : 'text-orange-300 hover:bg-orange-500/20'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Selector */}
      {showMetricSelector && (
        <div className="flex flex-wrap gap-2 mb-6">
          {metrics.map((metric) => (
            <motion.button
              key={metric.key}
              onClick={() => setActiveMetric(metric.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeMetric === metric.key
                  ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-orange-200'
                  : 'text-orange-400/70 hover:bg-orange-500/10 border border-transparent'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <metric.icon className="w-4 h-4" style={{ color: metric.color }} />
              {metric.label}
            </motion.button>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="h-80 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Chart Info */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 text-xs text-orange-400/70">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentMetric.color }} />
            <span>{currentMetric.label}: {formatValue(stats.current)}{currentMetric.suffix}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500/50" />
            <span>24h Range: {formatValue(stats.low)} - {formatValue(stats.high)}</span>
          </div>
          {chartType === 'composed' && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
              <span>Trades: {generateRealisticData[generateRealisticData.length - 1]?.trades || 0}</span>
            </div>
          )}
        </div>
        <div className="text-orange-400/50 flex items-center gap-2">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 bg-green-400 rounded-full"
          />
          Live • Updated {new Date().toLocaleTimeString()}
        </div>
      </div>
    </motion.div>
  )
}