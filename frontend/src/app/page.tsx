'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigation } from '@/components/Navigation'
import { SwapInterface } from '@/components/SwapInterface'
import { LiquidityInterface } from '@/components/LiquidityInterface'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'
import { GeometricBackground } from '@/components/ui/GeometricBackground'
import { ParticleField, NeuralNetwork } from '@/components/ui/PremiumEffects'

import { FloatingActions } from '@/components/ui/FloatingActions'
import { NotificationProvider } from '@/components/ui/NotificationSystem'
import { PerformanceOptimizer } from '@/components/ui/PerformanceOptimizer'
import { WalletProvider } from '@/components/providers/WalletProvider'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'swap' | 'liquidity' | 'analytics'>('swap')
  const [darkMode, setDarkMode] = useState(false)

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode))
    } else {
      // Check system preference
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
  }, [])

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'swap':
        return <SwapInterface />
      case 'liquidity':
        return <LiquidityInterface />
      case 'analytics':
        return <AnalyticsDashboard />
      default:
        return <SwapInterface />
    }
  }

  return (
    <WalletProvider>
    <NotificationProvider>
    <div className="min-h-screen relative overflow-hidden">
      {/* Performance Optimizer */}
      <PerformanceOptimizer />
      
      {/* Premium Background Effects */}
      <ParticleField />
      <NeuralNetwork />
      <GeometricBackground />



      {/* Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        darkMode={darkMode}
        onDarkModeToggle={handleDarkModeToggle}
      />

      {/* Main Content - Conditional Rendering */}
      {activeTab === 'swap' && (
        <>
          {/* Hero Section */}
          <section className="relative z-10 min-h-screen flex items-center">
            <div className="container mx-auto px-4">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left Content */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="space-y-8"
                >
                  <div>
                    <h1 className="text-6xl lg:text-7xl font-bold text-white mb-6">
                      Orbital <span className="text-orange-500">AMM</span>
                      <br />
                      <span className="text-white">Protocol</span>
                    </h1>
                    <p className="text-xl text-white/70 max-w-lg leading-relaxed">
                      Revolutionary AMM using spherical geometry and orbital mechanics.
                      Trade with optimal capital efficiency through mathematical innovation.
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-center"
                    >
                      <div className="text-3xl font-bold text-orange-500">5+</div>
                      <div className="text-sm text-white/60">Tokens Supported</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-center"
                    >
                      <div className="text-3xl font-bold text-orange-500">$3.54M</div>
                      <div className="text-sm text-white/60">Total Liquidity</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-center"
                    >
                      <div className="text-3xl font-bold text-orange-500">1000x</div>
                      <div className="text-sm text-white/60">Max Efficiency</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-center"
                    >
                      <div className="text-3xl font-bold text-orange-500">K = ||r||²</div>
                      <div className="text-sm text-white/60">Invariant</div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Right Content - Swap Interface */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <SwapInterface />
                </motion.div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Other Tab Content */}
      {activeTab !== 'swap' && (
        <main className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      )}

      {activeTab === 'swap' && (
        <>
          {/* Revolutionary Features Section */}
          <section className="relative z-10 py-20">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16"
              >
                <h2 className="text-5xl font-bold text-white mb-6">Spherical Innovation</h2>
                <p className="text-xl text-white/70 max-w-3xl mx-auto">
                  Built with advanced mathematics for the next generation of{' '}
                  <span className="text-orange-500">automated market makers</span>
                </p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: '⚛️',
                    title: 'Spherical Geometry',
                    description: 'Uses spherical invariant K = ||r||² where reserves form vectors in n-dimensional space, enabling optimal capital efficiency.'
                  },
                  {
                    icon: '🎯',
                    title: 'Concentrated Liquidity',
                    description: 'Interior and Boundary tick classification allows for concentrated liquidity positions with up to 1000x capital efficiency.'
                  },
                  {
                    icon: '📐',
                    title: 'Mathematical Precision',
                    description: 'Integer square root calculations and normalized reserve vectors ensure precise trading with minimal slippage.'
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    className="glass-morphism rounded-2xl p-8 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300"
                  >
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                    <p className="text-white/70 leading-relaxed">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {activeTab === 'swap' && (
        <>
          {/* Mathematical Process Flow */}
          <section className="relative z-10 py-20">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16"
              >
                <h2 className="text-5xl font-bold text-white mb-6">
                  <span className="text-orange-500">📐</span> Mathematical Process Flow
                </h2>
                <p className="text-xl text-white/70 max-w-3xl mx-auto">
                  Step-by-step breakdown of the spherical invariant calculation
                </p>
              </motion.div>

              <div className="grid md:grid-cols-5 gap-6">
                {[
                  {
                    icon: '📊',
                    title: 'Reserve Vector',
                    description: 'Calculate current reserves as n-dimensional vector r = [x₁, x₂, ..., xₙ]'
                  },
                  {
                    icon: '⚡',
                    title: 'K Constant',
                    description: 'Compute spherical invariant K = ||r||² = x₁² + x₂² + ... + xₙ²'
                  },
                  {
                    icon: '🔄',
                    title: 'Trade Calculation',
                    description: 'Solve for output: (rᵢₙ + Δᵢₙ)² + (rₒᵤₜ - Δₒᵤₜ)² + Σ(rᵢ²) = K'
                  },
                  {
                    icon: '√',
                    title: 'Integer Sqrt',
                    description: 'Use Newton&apos;s method for precise integer square root calculation'
                  },
                  {
                    icon: '✅',
                    title: 'Price Impact',
                    description: 'Calculate price impact and ensure optimal execution'
                  }
                ].map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="glass-morphism rounded-2xl p-6 border border-orange-500/20 text-center relative"
                  >
                    <div className="text-3xl mb-3">{step.icon}</div>
                    <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-white/70">{step.description}</p>

                    {index < 4 && (
                      <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-orange-500/50" />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {activeTab === 'swap' && (
        <>
          {/* Technical Deep Dive */}
          <section className="relative z-10 py-20">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16"
              >
                <h2 className="text-5xl font-bold text-orange-500 mb-6">Technical Deep Dive</h2>
                <p className="text-xl text-white/70 max-w-3xl mx-auto">
                  Advanced mathematics powering the next generation of{' '}
                  <span className="text-orange-500">automated market makers</span>
                </p>
              </motion.div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                {[
                  {
                    icon: '⚛️',
                    title: 'Spherical Invariant',
                    description: 'K = ||r||² maintains constant sum of squared reserves across all trades'
                  },
                  {
                    icon: '📐',
                    title: 'Vector Mathematics',
                    description: 'Reserves treated as n-dimensional vectors with precise geometric calculations'
                  },
                  {
                    icon: '🎯',
                    title: 'Tick Classification',
                    description: 'Interior/Boundary classification enables concentrated liquidity positions'
                  },
                  {
                    icon: '⚡',
                    title: 'Gas Optimization',
                    description: 'Integer arithmetic and Newton\'s method minimize computational costs'
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="glass-morphism rounded-2xl p-6 border border-orange-500/20 text-center"
                  >
                    <div className="text-3xl mb-3">{feature.icon}</div>
                    <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-white/70">{feature.description}</p>
                  </motion.div>
                ))}
              </div>

              {/* Technical Specifications */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="glass-morphism rounded-2xl p-8 border border-orange-500/20"
              >
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-orange-500">⚙️</span> Mathematical Specifications
                </h3>
                <p className="text-white/70 mb-6">Core mathematical functions and precision parameters</p>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-white/70">Invariant Formula</span>
                      <span className="text-white font-mono">K = ||r||² = Σ(xᵢ²)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Precision</span>
                      <span className="text-white font-mono">10¹⁸ (18 decimals)</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-white/70">Square Root Method</span>
                      <span className="text-white font-mono">Newton&apos;s Method</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Max Efficiency</span>
                      <span className="text-white font-mono">1000x Capital</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-white/70">Gas Estimation</span>
                      <span className="text-white font-mono">80K + 15K×complexity</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Supported Tokens</span>
                      <span className="text-white font-mono">n-dimensional</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        </>
      )}

      {/* Footer */}
      <footer className="relative z-10 mt-16 border-t border-orange-500/20 glass-morphism">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">O</span>
                </div>
                <div>
                  <div className="font-bold text-white">Orbital AMM</div>
                  <div className="text-xs text-white/60">Spherical Trading Protocol</div>
                </div>
              </div>
              <p className="text-white/70 text-sm">
                The future of spherical AMM is here. Unite every token, empower every trader, and
                unlock infinite possibilities with our revolutionary protocol.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <div className="space-y-2">
                <a href="#" className="block text-white/60 hover:text-white transition-colors">Swap</a>
                <a href="#" className="block text-white/60 hover:text-white transition-colors">Bridge</a>
                <a href="#" className="block text-white/60 hover:text-white transition-colors">Analytics</a>
                <a href="#" className="block text-white/60 hover:text-white transition-colors">API</a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Resources</h4>
              <div className="space-y-2">
                <a href="#" className="block text-white/60 hover:text-white transition-colors">Documentation</a>
                <a href="#" className="block text-white/60 hover:text-white transition-colors">Tutorials</a>
                <a href="#" className="block text-white/60 hover:text-white transition-colors">Blog</a>
                <a href="#" className="block text-white/60 hover:text-white transition-colors">Support</a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Community</h4>
              <div className="space-y-2">
                <a href="#" className="block text-white/60 hover:text-white transition-colors">Discord</a>
                <a href="#" className="block text-white/60 hover:text-white transition-colors">Twitter</a>
                <a href="#" className="block text-white/60 hover:text-white transition-colors">GitHub</a>
                <a href="#" className="block text-white/60 hover:text-white transition-colors">Telegram</a>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-orange-500/20 text-center">
            <p className="text-white/40 text-sm">
              © 2024 Orbital AMM • Spherical Geometry • Torus Invariants • Optimal Capital Efficiency
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Actions */}
      <FloatingActions />
    </div>
    </NotificationProvider>
    </WalletProvider>
  )
}