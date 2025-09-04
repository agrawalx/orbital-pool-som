'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, TrendingUp, AlertTriangle, CheckCircle, X } from 'lucide-react'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'info' | 'error'
  title: string
  message: string
  timestamp: Date
  action?: {
    label: string
    onClick: () => void
  }
}

export function SmartNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  // Mock notifications for demo
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'success',
        title: 'Position Optimized',
        message: 'Your USDC-USDT position has been rebalanced for better efficiency',
        timestamp: new Date(),
        action: {
          label: 'View Details',
          onClick: () => console.log('View position details')
        }
      },
      {
        id: '2',
        type: 'warning',
        title: 'High Impermanent Loss Risk',
        message: 'Your DAI position may experience IL due to price divergence',
        timestamp: new Date(Date.now() - 300000),
        action: {
          label: 'Adjust Position',
          onClick: () => console.log('Adjust position')
        }
      },
      {
        id: '3',
        type: 'info',
        title: 'New Yield Opportunity',
        message: 'FRAX-LUSD pool showing 15.2% APY - consider adding liquidity',
        timestamp: new Date(Date.now() - 600000)
      }
    ]
    setNotifications(mockNotifications)
  }, [])

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-400" />
      default: return <TrendingUp className="w-5 h-5 text-blue-400" />
    }
  }

  const getBorderColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'border-green-500/30'
      case 'warning': return 'border-yellow-500/30'
      case 'error': return 'border-red-500/30'
      default: return 'border-blue-500/30'
    }
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 hover:bg-orange-500/30 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bell className="w-5 h-5" />
        {notifications.length > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white"
          >
            {notifications.length}
          </motion.div>
        )}
      </motion.button>

      {/* Notifications Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto bg-black/90 backdrop-blur-xl border border-orange-500/20 rounded-xl shadow-2xl z-50"
          >
            <div className="p-4 border-b border-orange-500/20">
              <h3 className="font-semibold text-orange-300">Smart Notifications</h3>
              <p className="text-xs text-orange-400/70">AI-powered insights for your positions</p>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-orange-400/50">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`p-3 rounded-lg bg-gradient-to-r from-orange-500/5 to-amber-500/5 border ${getBorderColor(notification.type)} hover:border-opacity-50 transition-colors`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-orange-200 text-sm">
                              {notification.title}
                            </h4>
                            <p className="text-xs text-orange-300/70 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-orange-400/50 mt-2">
                              {notification.timestamp.toLocaleTimeString()}
                            </p>
                            {notification.action && (
                              <button
                                onClick={notification.action.onClick}
                                className="mt-2 text-xs bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 px-2 py-1 rounded border border-orange-500/30 transition-colors"
                              >
                                {notification.action.label}
                              </button>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="text-orange-400/50 hover:text-orange-300 transition-colors ml-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}