'use client'

import { motion } from 'framer-motion'
import { AdvancedChart } from '@/components/ui/AdvancedChart'
import { OrbitalVisualization } from '@/components/ui/OrbitalVisualization'
import { TrendingUp, Activity, Droplets, Zap, Users, Target, BarChart3, PieChart } from 'lucide-react'

export function AnalyticsDashboard() {
  // Key metrics for the orbital AMM
  const keyMetrics = [
    {
      title: 'Total Value Locked',
      value: '$3.75M',
      change: '+12.4%',
      changeType: 'positive' as const,
      icon: Droplets,
      color: '#f97316'
    },
    {
      title: '24h Trading Volume',
      value: '$847K',
      change: '+8.7%',
      changeType: 'positive' as const,
      icon: Activity,
      color: '#22c55e'
    },
    {
      title: 'Active Positions',
      value: '1,247',
      change: '+5.2%',
      changeType: 'positive' as const,
      icon: Users,
      color: '#3b82f6'
    },
    {
      title: 'Avg Capital Efficiency',
      value: '3.2x',
      change: '+0.8x',
      changeType: 'positive' as const,
      icon: Zap,
      color: '#8b5cf6'
    },
    {
      title: 'Protocol Fees (24h)',
      value: '$2,541',
      change: '+15.3%',
      changeType: 'positive' as const,
      icon: Target,
      color: '#f59e0b'
    },
    {
      title: 'Average APY',
      value: '14.2%',
      change: '+2.1%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: '#06b6d4'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {keyMetrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-morphism-dark rounded-xl p-6 border border-orange-500/20 hover:border-orange-400/30 transition-colors group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2 rounded-full border"
                  style={{ 
                    backgroundColor: `${metric.color}20`,
                    borderColor: `${metric.color}30`
                  }}
                  whileHover={{ scale: 1.1 }}
                  animate={{ 
                    rotate: index % 2 === 0 ? [0, 360] : [360, 0]
                  }}
                  transition={{ 
                    rotate: { duration: 8, repeat: Infinity, ease: "linear" }
                  }}
                >
                  <metric.icon className="w-5 h-5" style={{ color: metric.color }} />
                </motion.div>
                <div>
                  <h3 className="text-sm font-medium text-orange-300/70">{metric.title}</h3>
                  <div className="text-2xl font-bold text-orange-100">{metric.value}</div>
                </div>
              </div>
            </div>
            
            <div className={`flex items-center gap-2 text-sm ${
              metric.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
            }`}>
              <TrendingUp className="w-4 h-4" />
              <span>{metric.change} vs 24h ago</span>
            </div>
            
            {/* Mini sparkline effect */}
            <div className="mt-3 h-1 bg-black/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: metric.color }}
                initial={{ width: 0 }}
                animate={{ width: '70%' }}
                transition={{ duration: 1, delay: index * 0.1 }}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Liquidity Chart */}
        <AdvancedChart 
          title="Liquidity Analytics"
          className="col-span-1 xl:col-span-2"
        />
        
        {/* Orbital Visualization */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-1"
        >
          <div className="glass-morphism-dark rounded-2xl p-6 border border-orange-500/20">
            <h3 className="text-lg font-bold text-orange-300 mb-4 flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-5 h-5 text-orange-400" />
              </motion.div>
              Orbital Liquidity Map
            </h3>
            <OrbitalVisualization />
          </div>
        </motion.div>
      </div>

      {/* Secondary Chart */}
      <div className="grid grid-cols-1 gap-6">
        <AdvancedChart 
          title="Trading Performance & Volume Analysis"
          showMetricSelector={true}
        />
      </div>

      {/* Secondary Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pool Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-morphism-dark rounded-2xl p-6 border border-orange-500/20"
        >
          <h3 className="text-lg font-bold text-orange-300 mb-4 flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            >
              <PieChart className="w-5 h-5 text-orange-400" />
            </motion.div>
            Pool Distribution
          </h3>
          
          <div className="space-y-4">
            {[
              { token: 'USDC', percentage: 35, amount: '$1.31M', color: '#f97316' },
              { token: 'USDT', percentage: 28, amount: '$1.05M', color: '#f59e0b' },
              { token: 'DAI', percentage: 21, amount: '$788K', color: '#eab308' },
              { token: 'FRAX', percentage: 12, amount: '$450K', color: '#ca8a04' },
              { token: 'LUSD', percentage: 4, amount: '$150K', color: '#a16207' }
            ].map((pool, index) => (
              <motion.div
                key={pool.token}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-500/5 to-amber-500/5 border border-orange-500/20"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: pool.color }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                  />
                  <span className="font-semibold text-orange-200">{pool.token}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-orange-100">{pool.amount}</div>
                  <div className="text-xs text-orange-400/70">{pool.percentage}%</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Top Performers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-morphism-dark rounded-2xl p-6 border border-orange-500/20"
        >
          <h3 className="text-lg font-bold text-orange-300 mb-4 flex items-center gap-2">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <TrendingUp className="w-5 h-5 text-green-400" />
            </motion.div>
            Top Performers
          </h3>
          
          <div className="space-y-3">
            {[
              { pair: 'USDC/USDT', apy: '18.4%', efficiency: '4.2x', volume: '$234K' },
              { pair: 'DAI/FRAX', apy: '15.7%', efficiency: '3.8x', volume: '$187K' },
              { pair: 'USDT/DAI', apy: '12.9%', efficiency: '3.1x', volume: '$156K' },
              { pair: 'FRAX/LUSD', apy: '11.2%', efficiency: '2.9x', volume: '$98K' }
            ].map((performer, index) => (
              <motion.div
                key={performer.pair}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-green-200">{performer.pair}</span>
                  <span className="text-sm text-green-400 font-bold">{performer.apy}</span>
                </div>
                <div className="flex justify-between text-xs text-green-300/70">
                  <span>Efficiency: {performer.efficiency}</span>
                  <span>Volume: {performer.volume}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-morphism-dark rounded-2xl p-6 border border-orange-500/20"
        >
          <h3 className="text-lg font-bold text-orange-300 mb-4 flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 180, 360] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Activity className="w-5 h-5 text-blue-400" />
            </motion.div>
            Recent Activity
          </h3>
          
          <div className="space-y-3">
            {[
              { action: 'Large Swap', amount: '$45.2K USDC → USDT', time: '2m ago', type: 'swap' },
              { action: 'Liquidity Added', amount: '$12.8K to DAI/FRAX', time: '5m ago', type: 'add' },
              { action: 'Position Optimized', amount: 'USDT/DAI efficiency +0.3x', time: '8m ago', type: 'optimize' },
              { action: 'Fees Collected', amount: '$234 from USDC/USDT', time: '12m ago', type: 'fees' }
            ].map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border border-blue-500/20"
              >
                <motion.div
                  className={`w-2 h-2 rounded-full ${
                    activity.type === 'swap' ? 'bg-orange-400' :
                    activity.type === 'add' ? 'bg-green-400' :
                    activity.type === 'optimize' ? 'bg-purple-400' :
                    'bg-yellow-400'
                  }`}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-blue-200">{activity.action}</div>
                  <div className="text-xs text-blue-300/70">{activity.amount}</div>
                </div>
                <div className="text-xs text-blue-400/50">{activity.time}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}