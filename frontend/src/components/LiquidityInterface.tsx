'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Info, TrendingUp, Droplets } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TokenSelector } from '@/components/ui/TokenSelector'
import { OrbitalSpinner } from '@/components/ui/LoadingSpinner'
import { TOKENS } from '@/lib/constants'
import { OrbitalMath, parseTokenAmount, formatTokenAmount } from '@/lib/orbital-math'
import { formatNumber, formatCurrency } from '@/lib/utils'

interface LiquidityPosition {
  id: string
  radius: bigint
  planeConstant: bigint
  reserves: bigint[]
  liquidity: bigint
  status: 'Interior' | 'Boundary'
  efficiency: number
}

export function LiquidityInterface() {
  const [mode, setMode] = useState<'add' | 'remove'>('add')
  const [selectedTokens, setSelectedTokens] = useState<typeof TOKENS[number][]>([TOKENS[0], TOKENS[1], TOKENS[2]])
  const [amounts, setAmounts] = useState(['', '', ''])
  const [radius, setRadius] = useState('100000')
  const [planeConstant, setPlaneConstant] = useState('80000')
  const [isProcessing, setIsProcessing] = useState(false)
  const [positions, setPositions] = useState<LiquidityPosition[]>([])

  // Mock existing positions
  useEffect(() => {
    const mockPositions: LiquidityPosition[] = [
      {
        id: '1',
        radius: parseTokenAmount('100000', 18),
        planeConstant: parseTokenAmount('80000', 18),
        reserves: [
          parseTokenAmount('10000', 6),
          parseTokenAmount('10000', 6),
          parseTokenAmount('10000', 18)
        ],
        liquidity: parseTokenAmount('30000', 18),
        status: 'Interior',
        efficiency: 2.5
      },
      {
        id: '2',
        radius: parseTokenAmount('150000', 18),
        planeConstant: parseTokenAmount('120000', 18),
        reserves: [
          parseTokenAmount('5000', 6),
          parseTokenAmount('5000', 6),
          parseTokenAmount('5000', 18)
        ],
        liquidity: parseTokenAmount('15000', 18),
        status: 'Boundary',
        efficiency: 4.2
      }
    ]
    setPositions(mockPositions)
  }, [])

  const calculatedLiquidity = useMemo(() => {
    try {
      const reserves = amounts.map((amount, index) => 
        amount ? parseTokenAmount(amount, selectedTokens[index].decimals) : BigInt(0)
      )
      
      if (reserves.every(r => r === BigInt(0))) return BigInt(0)
      
      return OrbitalMath.calculateLiquidity(reserves)
    } catch {
      return BigInt(0)
    }
  }, [amounts, selectedTokens])

  const tickStatus = useMemo(() => {
    try {
      const reserves = amounts.map((amount, index) => 
        amount ? parseTokenAmount(amount, selectedTokens[index].decimals) : BigInt(0)
      )
      
      if (reserves.every(r => r === BigInt(0))) return 'Interior'
      
      return OrbitalMath.classifyTick(
        reserves,
        parseTokenAmount(radius, 18),
        parseTokenAmount(planeConstant, 18)
      )
    } catch {
      return 'Interior'
    }
  }, [amounts, selectedTokens, radius, planeConstant])

  const efficiency = useMemo(() => {
    try {
      const concentratedReserves = amounts.map((amount, index) => 
        amount ? parseTokenAmount(amount, selectedTokens[index].decimals) : BigInt(0)
      )
      
      if (concentratedReserves.every(r => r === BigInt(0))) return 1
      
      // Create uniform distribution for comparison
      const totalLiquidity = concentratedReserves.reduce((sum, r) => sum + r, BigInt(0))
      const avgLiquidity = totalLiquidity / BigInt(concentratedReserves.length)
      const uniformReserves = concentratedReserves.map(() => avgLiquidity)
      
      return OrbitalMath.calculateEfficiency(concentratedReserves, uniformReserves)
    } catch {
      return 1
    }
  }, [amounts, selectedTokens])

  const handleAddToken = () => {
    if (selectedTokens.length < 5) {
      const availableTokens = TOKENS.filter(token => 
        !selectedTokens.some(selected => selected.symbol === token.symbol)
      )
      if (availableTokens.length > 0) {
        setSelectedTokens([...selectedTokens, availableTokens[0]])
        setAmounts([...amounts, ''])
      }
    }
  }

  const handleRemoveToken = (index: number) => {
    if (selectedTokens.length > 2) {
      setSelectedTokens(selectedTokens.filter((_, i) => i !== index))
      setAmounts(amounts.filter((_, i) => i !== index))
    }
  }

  const handleTokenChange = (index: number, token: typeof TOKENS[number]) => {
    const newTokens = [...selectedTokens]
    newTokens[index] = token
    setSelectedTokens(newTokens)
  }

  const handleAmountChange = (index: number, value: string) => {
    const newAmounts = [...amounts]
    newAmounts[index] = value
    setAmounts(newAmounts)
  }

  const handleAddLiquidity = async () => {
    setIsProcessing(true)
    
    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Add new position
    const newPosition: LiquidityPosition = {
      id: Date.now().toString(),
      radius: parseTokenAmount(radius, 18),
      planeConstant: parseTokenAmount(planeConstant, 18),
      reserves: amounts.map((amount, index) => 
        parseTokenAmount(amount || '0', selectedTokens[index].decimals)
      ),
      liquidity: calculatedLiquidity,
      status: tickStatus,
      efficiency
    }
    
    setPositions([...positions, newPosition])
    
    // Reset form
    setAmounts(amounts.map(() => ''))
    setIsProcessing(false)
    
    alert('Liquidity added successfully!')
  }

  const handleRemoveLiquidity = async (positionId: string) => {
    setIsProcessing(true)
    
    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setPositions(positions.filter(p => p.id !== positionId))
    setIsProcessing(false)
    
    alert('Liquidity removed successfully!')
  }

  const isValidLiquidity = amounts.some(amount => amount && parseFloat(amount) > 0)

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-morphism-dark rounded-2xl p-6 border border-orange-500/20"
      >
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="p-2 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30"
          >
            <Droplets className="w-6 h-6 text-orange-400" />
          </motion.div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
            Orbital Liquidity
          </h2>
        </div>
        
        <div className="flex gap-3 mb-6">
          <Button
            variant={mode === 'add' ? 'primary' : 'outline'}
            onClick={() => setMode('add')}
            className={`flex-1 h-12 font-semibold transition-all duration-300 ${
              mode === 'add' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25' 
                : 'border-orange-500/30 text-orange-300 hover:border-orange-400/50 hover:bg-orange-500/10'
            }`}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Liquidity
          </Button>
          <Button
            variant={mode === 'remove' ? 'primary' : 'outline'}
            onClick={() => setMode('remove')}
            className={`flex-1 h-12 font-semibold transition-all duration-300 ${
              mode === 'remove' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25' 
                : 'border-orange-500/30 text-orange-300 hover:border-orange-400/50 hover:bg-orange-500/10'
            }`}
            icon={<Minus className="w-4 h-4" />}
          >
            Remove Liquidity
          </Button>
        </div>

          <AnimatePresence mode="wait">
            {mode === 'add' ? (
              <motion.div
                key="add"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Tick Parameters */}
                <div className="bg-gradient-to-br from-orange-500/5 to-amber-500/5 border border-orange-500/20 rounded-xl p-5 space-y-4">
                  <h3 className="font-semibold text-orange-300 flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border border-orange-400 rounded-full"
                    />
                    Tick Parameters
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Radius (R)"
                      type="number"
                      value={radius}
                      onChange={(e) => setRadius(e.target.value)}
                      placeholder="100000"
                      className="bg-black/20 border-orange-500/30 text-orange-100 placeholder-orange-400/50 focus:border-orange-400"
                    />
                    <Input
                      label="Plane Constant (P)"
                      type="number"
                      value={planeConstant}
                      onChange={(e) => setPlaneConstant(e.target.value)}
                      placeholder="80000"
                      className="bg-black/20 border-orange-500/30 text-orange-100 placeholder-orange-400/50 focus:border-orange-400"
                    />
                  </div>
                  <div className="text-xs text-orange-400/70 flex items-center gap-2">
                    <Info className="w-3 h-3" />
                    Radius defines tick size, Plane Constant defines boundary position
                  </div>
                </div>

                {/* Token Inputs */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-orange-300">Token Amounts</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddToken}
                      disabled={selectedTokens.length >= 5}
                      className="border-orange-500/30 text-orange-300 hover:border-orange-400/50 hover:bg-orange-500/10 disabled:opacity-50"
                      icon={<Plus className="w-3 h-3" />}
                    >
                      Add Token
                    </Button>
                  </div>

                  {selectedTokens.map((token, index) => (
                    <motion.div
                      key={`${token.symbol}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 items-end"
                    >
                      <div className="flex-1">
                        <Input
                          label={`${token.symbol} Amount`}
                          type="number"
                          value={amounts[index]}
                          onChange={(e) => handleAmountChange(index, e.target.value)}
                          placeholder="0.0"
                        />
                      </div>
                      <TokenSelector
                        selectedToken={token}
                        onTokenSelect={(newToken) => handleTokenChange(index, newToken)}
                        excludeTokens={selectedTokens.filter((_, i) => i !== index).map(t => t.symbol)}
                        className="w-32"
                      />
                      {selectedTokens.length > 2 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveToken(index)}
                          className="p-2 mb-1"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Position Preview */}
                {isValidLiquidity && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-xl p-5 space-y-4"
                  >
                    <h4 className="font-semibold text-orange-300 flex items-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 bg-orange-400 rounded-full"
                      />
                      Position Preview
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <span className="text-orange-400/70">Liquidity</span>
                        <div className="font-semibold text-orange-200">
                          {formatNumber(Number(formatTokenAmount(calculatedLiquidity, 18)))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-orange-400/70">Status</span>
                        <div className={`font-semibold ${tickStatus === 'Boundary' ? 'text-amber-400' : 'text-green-400'}`}>
                          {tickStatus}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-orange-400/70">Efficiency</span>
                        <div className="font-semibold text-orange-300">
                          {formatNumber(efficiency, 2)}x
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-orange-400/70">Est. APY</span>
                        <div className="font-semibold text-green-400">
                          {formatNumber(efficiency * 5, 1)}%
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Add Liquidity Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleAddLiquidity}
                    disabled={!isValidLiquidity || isProcessing}
                    loading={isProcessing}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-0 shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    icon={isProcessing ? <OrbitalSpinner size="sm" /> : undefined}
                  >
                    {isProcessing ? 'Adding Liquidity...' : 'Add Liquidity'}
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="remove"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-semibold text-orange-300">Your Positions</h3>
                
                {positions.length === 0 ? (
                  <div className="text-center py-8 text-orange-400/50">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                      <Droplets className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    </motion.div>
                    <p>No liquidity positions found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {positions.map((position) => (
                      <motion.div
                        key={position.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-xl p-4 space-y-3 hover:border-orange-400/30 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">Position #{position.id}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                position.status === 'Boundary' 
                                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                                  : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                              }`}>
                                {position.status}
                              </span>
                            </div>
                            <div className="text-sm text-orange-400/70">
                              Liquidity: {formatNumber(Number(formatTokenAmount(position.liquidity, 18)))}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-orange-400/70">Efficiency</div>
                            <div className="font-semibold text-orange-300">
                              {formatNumber(position.efficiency, 2)}x
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {position.reserves.map((reserve, index) => (
                            <div key={index} className="bg-black/20 border border-orange-500/20 rounded-lg p-2">
                              <div className="text-orange-400/70">
                                {TOKENS[index]?.symbol || `Token ${index}`}
                              </div>
                              <div className="font-medium text-orange-200">
                                {formatNumber(Number(formatTokenAmount(reserve, TOKENS[index]?.decimals || 18)))}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveLiquidity(position.id)}
                          disabled={isProcessing}
                          className="w-full bg-gradient-to-r from-red-500/80 to-orange-500/80 hover:from-red-600/80 hover:to-orange-600/80 border-0"
                          icon={<Minus className="w-4 h-4" />}
                        >
                          Remove Liquidity
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
      </motion.div>

      {/* Liquidity Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-morphism-dark rounded-2xl p-6 border border-orange-500/20"
      >
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30"
          >
            <TrendingUp className="w-5 h-5 text-green-400" />
          </motion.div>
          <h2 className="text-xl font-bold text-orange-300">Pool Statistics</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div 
            className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-2xl font-bold text-blue-400">
              {formatCurrency(1234567)}
            </div>
            <div className="text-sm text-blue-300/70">Total Liquidity</div>
          </motion.div>
          <motion.div 
            className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-2xl font-bold text-green-400">
              {formatNumber(12.5, 1)}%
            </div>
            <div className="text-sm text-green-300/70">Average APY</div>
          </motion.div>
          <motion.div 
            className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-2xl font-bold text-orange-400">
              {formatNumber(3.2, 1)}x
            </div>
            <div className="text-sm text-orange-300/70">Avg Efficiency</div>
          </motion.div>
          <motion.div 
            className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-2xl font-bold text-purple-400">
              {formatCurrency(45678)}
            </div>
            <div className="text-sm text-purple-300/70">24h Volume</div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}