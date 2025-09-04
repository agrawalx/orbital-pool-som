/**
 * Orbital AMM - Notification System
 * 
 * Advanced notification system with multiple types and animations.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, createContext, useContext } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Info, 
  X,
  TrendingUp,
  Activity
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'trade' | 'system';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);

    // Auto remove after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface NotificationCardProps {
  notification: Notification;
  onClose: () => void;
}

function NotificationCard({ notification, onClose }: NotificationCardProps) {
  const { type, title, message, action } = notification;

  const config = {
    success: {
      icon: CheckCircle,
      colors: 'border-green-500/50 bg-green-500/10 text-green-300',
      iconColor: 'text-green-400',
    },
    error: {
      icon: XCircle,
      colors: 'border-red-500/50 bg-red-500/10 text-red-300',
      iconColor: 'text-red-400',
    },
    warning: {
      icon: AlertCircle,
      colors: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300',
      iconColor: 'text-yellow-400',
    },
    info: {
      icon: Info,
      colors: 'border-blue-500/50 bg-blue-500/10 text-blue-300',
      iconColor: 'text-blue-400',
    },
    trade: {
      icon: TrendingUp,
      colors: 'border-orange-500/50 bg-orange-500/10 text-orange-300',
      iconColor: 'text-orange-400',
    },
    system: {
      icon: Activity,
      colors: 'border-purple-500/50 bg-purple-500/10 text-purple-300',
      iconColor: 'text-purple-400',
    },
  };

  const { icon: Icon, colors, iconColor } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`
        glass-morphism-dark rounded-xl p-4 border ${colors}
        shadow-lg backdrop-blur-sm max-w-sm
      `}
    >
      <div className="flex items-start gap-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 500 }}
          className={iconColor}
        >
          <Icon className="w-5 h-5" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-1">{title}</h4>
          <p className="text-xs opacity-80 leading-relaxed">{message}</p>
          
          {action && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={action.onClick}
              className="mt-2 text-xs font-medium underline hover:no-underline transition-all"
            >
              {action.label}
            </motion.button>
          )}
        </div>

        <motion.button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors p-1"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Progress bar for timed notifications */}
      {notification.duration && notification.duration > 0 && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-current opacity-30 rounded-b-xl"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: notification.duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
}

/**
 * Demo notifications for testing
 */
export function NotificationDemo() {
  const { addNotification } = useNotifications();

  const demoNotifications = [
    {
      type: 'success' as const,
      title: 'Trade Executed',
      message: 'Successfully swapped 100 USDC for 99.87 USDT',
      action: {
        label: 'View Transaction',
        onClick: () => console.log('View transaction'),
      },
    },
    {
      type: 'trade' as const,
      title: 'Large Trade Alert',
      message: 'Someone just swapped $50K USDC → DAI with 0.02% price impact',
    },
    {
      type: 'system' as const,
      title: 'Protocol Update',
      message: 'New liquidity incentives are now live. Earn up to 25% APY!',
    },
    {
      type: 'warning' as const,
      title: 'High Price Impact',
      message: 'This trade will have 5.2% price impact. Consider reducing size.',
    },
    {
      type: 'error' as const,
      title: 'Transaction Failed',
      message: 'Insufficient gas fee. Please increase gas limit and try again.',
    },
  ];

  return (
    <div className="fixed bottom-4 left-4 space-y-2">
      {demoNotifications.map((notification, index) => (
        <motion.button
          key={index}
          onClick={() => addNotification(notification)}
          className="block px-3 py-2 bg-gray-800 text-white text-xs rounded hover:bg-gray-700 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Test {notification.type}
        </motion.button>
      ))}
    </div>
  );
}