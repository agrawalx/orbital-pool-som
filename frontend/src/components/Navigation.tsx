'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeftRight, 
  Droplets, 
  BarChart3, 
  Settings, 
  Moon, 
  Sun, 
  Menu, 
  X,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { WalletButton } from '@/components/ui/WalletButton'

interface NavigationProps {
  activeTab: 'swap' | 'liquidity' | 'analytics'
  onTabChange: (tab: 'swap' | 'liquidity' | 'analytics') => void
  darkMode: boolean
  onDarkModeToggle: () => void
}

export function Navigation({ activeTab, onTabChange, darkMode, onDarkModeToggle }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const tabs = [
    { id: 'swap' as const, label: 'Swap', icon: ArrowLeftRight },
    { id: 'liquidity' as const, label: 'Liquidity', icon: Droplets },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
  ]

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center justify-between p-6 glass-morphism-dark border-b border-orange-500/20 relative overflow-hidden">
        {/* Logo */}
        <motion.div 
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="relative">
            <motion.div
              className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              style={{
                boxShadow: '0 0 20px rgba(249, 115, 22, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="w-7 h-7 border-2 border-white rounded-full" />
            </motion.div>
            <motion.div
              className="absolute inset-0 w-12 h-12 border-2 border-orange-400/50 rounded-xl"
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            />
            <div className="absolute -inset-1 bg-orange-500 rounded-xl blur opacity-20" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wider">
              ORBITAL AMM
            </h1>
            <p className="text-xs text-orange-300/70 font-mono tracking-widest">
              SPHERICAL LIQUIDITY PROTOCOL
            </p>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 glass-morphism rounded-2xl p-2 border border-orange-500/20">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 font-mono tracking-wider ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-orange-300/70 hover:text-orange-300'
                }`}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-orange-500 rounded-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    style={{
                      boxShadow: '0 0 20px rgba(249, 115, 22, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)'
                    }}
                  />
                )}
                <div className="relative flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  {tab.label.toUpperCase()}
                </div>
                {activeTab === tab.id && (
                  <motion.div
                    className="absolute -inset-1 bg-orange-500 rounded-xl blur opacity-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <motion.button
            onClick={onDarkModeToggle}
            className="p-3 glass-morphism rounded-xl border border-orange-500/20 text-orange-300 hover:text-orange-100 transition-all duration-300"
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </motion.button>

          {/* Settings */}
          <motion.button
            className="p-3 glass-morphism rounded-xl border border-orange-500/20 text-orange-300 hover:text-orange-100 transition-all duration-300"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <Settings className="w-5 h-5" />
          </motion.button>

          {/* Wallet Connection */}
          <WalletButton />
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rounded-full" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Orbital
          </span>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Navigation Items */}
                <div className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          onTabChange(tab.id)
                          setIsMobileMenuOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Wallet Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <WalletButton className="w-full" />
                </div>

                {/* Settings */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-3">
                  <Button
                    variant="ghost"
                    onClick={onDarkModeToggle}
                    className="w-full justify-start"
                    icon={darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  >
                    {darkMode ? 'Light Mode' : 'Dark Mode'}
                  </Button>
                  
                  <Button variant="ghost" className="w-full justify-start" icon={<Settings className="w-4 h-4" />}>
                    Settings
                  </Button>
                  
                  <Button variant="ghost" className="w-full justify-start" icon={<ExternalLink className="w-4 h-4" />}>
                    Documentation
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}