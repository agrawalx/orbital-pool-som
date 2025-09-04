'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, Activity, Droplets, Zap, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TOKENS, CHART_COLORS } from '@/lib/constants'
import { formatNumber, formatCurrency } from '@/lib/utils'

interface PoolData {
  token: string
  reserves: number
  volume24h: number
  fees24h: number
  utilization: number
}

interface VolumeData {
  time: string
  volume: number
  fees: number
}

interface EfficiencyData {
  position: string
  efficiency: number
  liquidity: number
  apy: number
}

export function PoolAnalytics() {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h')

  // Mock data for demonstration
  const poolData: PoolData[] = useMemo(() => [
    { token: 'USDC', reserves: 1000000, volume24h: 125000, fees24h: 375, utilization: 85 },
    { token: 'USDT', reserves: 950000, volume24h: 110000, fees24h: 330, utilization: 78 },
    { token: 'DAI', reserves: 800000, volume24h: 95000, fees24h: 285, utilization: 72 },
    { token: 'FRAX', reserves: 600000, volume24h: 75000, fees24h: 225, utilization: 65 },
    { token: 'LUSD', reserves: 400000, volume24h: 50000, fees24h: 150, utilization: 58 },
  ], [])

  const volumeData: VolumeData[] = useMemo(() => {
    const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720
    return Array.from({ length: Math.min(hours, 24) }, (_, i) => ({
      time: timeframe === '24h' ? `${i}:00` : `Day ${i + 1}`,
      volume: Math.random() * 100000 + 50000,
      fees: Math.random() * 300 + 100,
    }))
  }, [timeframe])

  const efficiencyData: EfficiencyData[] = useMemo(() => [
    { position: 'Interior Ticks', efficiency: 2.8, liquidity: 2500000, apy: 14.2 },
    { position: 'Boundary Ticks', efficiency: 4.5, liquidity: 1800000, apy: 22.8 },
    { position: 'Mixed Positions', efficiency: 3.2, liquidity: 1200000, apy: 16.5 },
  ], [])

  const totalLiquidity = poolData.reduce((sum, pool) => sum + pool.reserves, 0)
  const total24hVolume = poolData.reduce((sum, pool) => sum + pool.volume24h, 0)
  const total24hFees = poolData.reduce((sum, pool) => sum + pool.fees24h, 0)
  const avgEfficiency = efficiencyData.reduce((sum, eff) => sum + eff.efficiency, 0) / efficiencyData.length

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-morphism-dark rounded-xl p-6 border border-blue-500/20 hover:border-blue-400/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-300/70">Total Liquidity</p>
              <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalLiquidity)}</p>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="p-2 rounded-full bg-blue-500/20 border border-blue-500/30"
            >
              <Droplets className="w-6 h-6 text-blue-400" />
            </motion.div>
          </div>
          <div className="mt-3 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-400 mr-2" />
            <span className="text-green-400 font-semibold">+5.2%</span>
            <span className="text-blue-300/50 ml-2">vs yesterday</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-morphism-dark rounded-xl p-6 border border-green-500/20 hover:border-green-400/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-300/70">24h Volume</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(total24hVolume)}</p>
            </div>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-2 rounded-full bg-green-500/20 border border-green-500/30"
            >
              <Activity className="w-6 h-6 text-green-400" />
            </motion.div>
          </div>
          <div className="mt-3 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-400 mr-2" />
            <span className="text-green-400 font-semibold">+12.8%</span>
            <span className="text-green-300/50 ml-2">vs yesterday</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-morphism-dark rounded-xl p-6 border border-purple-500/20 hover:border-purple-400/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-300/70">24h Fees</p>
              <p className="text-2xl font-bold text-purple-400">{formatCurrency(total24hFees)}</p>
            </div>
            <motion.div
              animate={{ 
                rotate: [0, 180, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="p-2 rounded-full bg-purple-500/20 border border-purple-500/30"
            >
              <Zap className="w-6 h-6 text-purple-400" />
            </motion.div>
          </div>
          <div className="mt-3 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-400 mr-2" />
            <span className="text-green-400 font-semibold">+8.4%</span>
            <span className="text-purple-300/50 ml-2">vs yesterday</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-morphism-dark rounded-xl p-6 border border-orange-500/20 hover:border-orange-400/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-300/70">Avg Efficiency</p>
              <p className="text-2xl font-bold text-orange-400">{formatNumber(avgEfficiency, 1)}x</p>
            </div>
            <motion.div
              animate={{ 
                y: [0, -5, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-2 rounded-full bg-orange-500/20 border border-orange-500/30"
            >
              <TrendingUp className="w-6 h-6 text-orange-400" />
            </motion.div>
          </div>
          <div className="mt-3 flex items-center text-sm">
            <Info className="w-4 h-4 text-orange-400 mr-2" />
            <span className="text-orange-300/70">Capital efficiency</span>
          </div>
        </motion.div>
      </div>

      {/* Volume and Fees Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-morphism-dark rounded-2xl p-6 border border-orange-500/20"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-orange-300 flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border border-orange-400 rounded-full"
            />
            Volume & Fees
          </h3>
          <div className="flex gap-2">
            {(['24h', '7d', '30d'] as const).map((period) => (
              <Button
                key={period}
                variant={timeframe === period ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTimeframe(period)}
                className={timeframe === period 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-0' 
                  : 'border-orange-500/30 text-orange-300 hover:border-orange-400/50 hover:bg-orange-500/10'
                }
              >
                {period}
              </Button>
            ))}
          </div>
        </div>
        <div className="chart-container">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="time" 
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatNumber(value)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'volume' ? formatCurrency(value) : formatCurrency(value),
                    name === 'volume' ? 'Volume' : 'Fees'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="fees" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-morphism-dark rounded-2xl p-6 border border-orange-500/20"
        >
          <h3 className="text-xl font-bold text-orange-300 mb-6 flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-4 h-4 bg-orange-400 rounded-full"
            />
            Token Distribution
          </h3>
          <div className="chart-container">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={poolData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="reserves"
                  >
                    {poolData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Reserves']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 space-y-3">
              {poolData.map((token, index) => (
                <motion.div 
                  key={token.token} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between text-sm p-3 rounded-lg bg-gradient-to-r from-orange-500/5 to-amber-500/5 border border-orange-500/20 hover:border-orange-400/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                    />
                    <span className="font-semibold text-orange-200">{token.token}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-orange-100">{formatCurrency(token.reserves)}</div>
                    <div className="text-orange-400/70">
                      {formatNumber((token.reserves / totalLiquidity) * 100, 1)}%
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Efficiency Analysis */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-morphism-dark rounded-2xl p-6 border border-orange-500/20"
        >
          <h3 className="text-xl font-bold text-orange-300 mb-6 flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full"
            />
            Capital Efficiency
          </h3>
          <div className="chart-container">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={efficiencyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="position" 
                    className="text-xs"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'efficiency' ? `${formatNumber(value, 1)}x` : 
                      name === 'liquidity' ? formatCurrency(value) :
                      `${formatNumber(value, 1)}%`,
                      name === 'efficiency' ? 'Efficiency' :
                      name === 'liquidity' ? 'Liquidity' : 'APY'
                    ]}
                  />
                  <Bar dataKey="efficiency" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 space-y-3">
              {efficiencyData.map((item, index) => (
                <motion.div
                  key={item.position}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-lg hover:border-orange-400/30 transition-colors"
                >
                  <div>
                    <div className="font-semibold text-sm text-orange-200">{item.position}</div>
                    <div className="text-xs text-orange-400/70">
                      {formatCurrency(item.liquidity)} liquidity
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-orange-300">
                      {formatNumber(item.efficiency, 1)}x
                    </div>
                    <div className="text-xs text-green-400 font-semibold">
                      {formatNumber(item.apy, 1)}% APY
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Token Performance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass-morphism-dark rounded-2xl p-6 border border-orange-500/20"
      >
        <h3 className="text-xl font-bold text-orange-300 mb-6 flex items-center gap-2">
          <motion.div
            animate={{ 
              rotate: [0, 90, 180, 270, 360],
              scale: [1, 1.1, 1, 1.1, 1]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-4 h-4 bg-gradient-to-r from-orange-400 to-amber-400 rounded"
          />
          Token Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-orange-500/20">
                <th className="text-left py-4 px-3 font-semibold text-orange-300">Token</th>
                <th className="text-right py-4 px-3 font-semibold text-orange-300">Reserves</th>
                <th className="text-right py-4 px-3 font-semibold text-orange-300">24h Volume</th>
                <th className="text-right py-4 px-3 font-semibold text-orange-300">24h Fees</th>
                <th className="text-right py-4 px-3 font-semibold text-orange-300">Utilization</th>
              </tr>
            </thead>
              <tbody>
                {poolData.map((token, index) => (
                  <motion.tr
                    key={token.token}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-orange-500/10 hover:bg-gradient-to-r hover:from-orange-500/5 hover:to-amber-500/5 transition-colors"
                  >
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-3">
                        <motion.div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold border border-orange-500/30"
                          style={{ backgroundColor: TOKENS.find(t => t.symbol === token.token)?.color || '#f97316' }}
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: index * 0.5 }}
                        >
                          {token.token.charAt(0)}
                        </motion.div>
                        <span className="font-semibold text-orange-200">{token.token}</span>
                      </div>
                    </td>
                    <td className="text-right py-4 px-3 font-semibold text-orange-100">
                      {formatCurrency(token.reserves)}
                    </td>
                    <td className="text-right py-4 px-3 text-orange-200">
                      {formatCurrency(token.volume24h)}
                    </td>
                    <td className="text-right py-4 px-3 text-green-400 font-semibold">
                      {formatCurrency(token.fees24h)}
                    </td>
                    <td className="text-right py-4 px-3">
                      <div className="flex items-center justify-end gap-3">
                        <div className="w-20 h-2 bg-black/30 border border-orange-500/20 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full"
                            style={{ width: `${token.utilization}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${token.utilization}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                          />
                        </div>
                        <span className="text-xs font-semibold w-10 text-orange-300">
                          {token.utilization}%
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
      </motion.div>
    </div>
  )
}