/**
 * Orbital AMM - Floating Action Buttons
 * 
 * Premium floating action buttons for quick access to key features.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { 
  Settings, 
  HelpCircle, 
  BookOpen, 
  MessageCircle, 
  Zap,
  X
} from 'lucide-react';

export function FloatingActions() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      icon: Settings,
      label: 'Settings',
      color: 'from-gray-500 to-slate-600',
      onClick: () => console.log('Settings'),
    },
    {
      icon: HelpCircle,
      label: 'Help',
      color: 'from-blue-500 to-cyan-600',
      onClick: () => console.log('Help'),
    },
    {
      icon: BookOpen,
      label: 'Docs',
      color: 'from-green-500 to-emerald-600',
      onClick: () => console.log('Documentation'),
    },
    {
      icon: MessageCircle,
      label: 'Support',
      color: 'from-purple-500 to-pink-600',
      onClick: () => console.log('Support'),
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-16 right-0 space-y-3"
          >
            {actions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                  transition: { delay: index * 0.1 }
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0, 
                  y: 20,
                  transition: { delay: (actions.length - index - 1) * 0.1 }
                }}
                onClick={action.onClick}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-full
                  bg-gradient-to-r ${action.color}
                  text-white font-medium shadow-lg
                  hover:shadow-xl transition-all duration-300
                  backdrop-blur-sm border border-white/20
                `}
                whileHover={{ scale: 1.05, x: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <action.icon className="w-5 h-5" />
                <span className="text-sm whitespace-nowrap">{action.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-14 h-14 rounded-full
          bg-gradient-to-r from-orange-500 to-red-600
          text-white shadow-lg hover:shadow-xl
          flex items-center justify-center
          transition-all duration-300
          backdrop-blur-sm border border-white/20
        "
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        style={{
          boxShadow: '0 8px 32px rgba(249, 115, 22, 0.4)',
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
            >
              <Zap className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Pulse Effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-orange-500/30"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

/**
 * Quick action tooltip component
 */
interface QuickActionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  color?: string;
}

export function QuickAction({ 
  icon: Icon, 
  label, 
  onClick, 
  color = 'from-blue-500 to-purple-600' 
}: QuickActionProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        group relative px-4 py-2 rounded-full
        bg-gradient-to-r ${color}
        text-white font-medium shadow-lg
        hover:shadow-xl transition-all duration-300
        backdrop-blur-sm border border-white/20
      `}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      
      {/* Tooltip */}
      <div className="
        absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
        px-2 py-1 bg-black/80 text-white text-xs rounded
        opacity-0 group-hover:opacity-100 transition-opacity
        pointer-events-none whitespace-nowrap
      ">
        {label}
      </div>
    </motion.button>
  );
}