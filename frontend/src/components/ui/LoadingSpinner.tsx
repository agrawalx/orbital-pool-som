/**
 * Orbital AMM - Loading Spinner Components
 * 
 * Professional loading animations with orbital theme styling.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <motion.div
      className={cn('flex items-center justify-center', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className={cn(
          'border-2 border-gray-300 border-t-blue-600 rounded-full',
          sizes[size]
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
    </motion.div>
  )
}

export function OrbitalSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  return (
    <motion.div
      className={cn('flex items-center justify-center', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className={cn('relative', sizes[size])}>
        {/* Outer orbit with glow */}
        <motion.div
          className="absolute inset-0 border-2 border-cyan-400 rounded-full"
          animate={{ rotate: 360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear'
          }}
          style={{
            boxShadow: '0 0 10px rgba(0, 212, 255, 0.5), inset 0 0 10px rgba(0, 212, 255, 0.2)'
          }}
        />
        
        {/* Inner orbit with glow */}
        <motion.div
          className="absolute inset-2 border-2 border-purple-400 rounded-full"
          animate={{ rotate: -360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear'
          }}
          style={{
            boxShadow: '0 0 8px rgba(147, 51, 234, 0.5), inset 0 0 8px rgba(147, 51, 234, 0.2)'
          }}
        />
        
        {/* Center core with pulse */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
        >
          <motion.div
            className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"
            animate={{ 
              scale: [1, 1.3, 1],
              boxShadow: [
                '0 0 10px rgba(0, 212, 255, 0.5)',
                '0 0 20px rgba(0, 212, 255, 0.8)',
                '0 0 10px rgba(0, 212, 255, 0.5)'
              ]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </motion.div>
        
        {/* Orbital particles with trails */}
        <motion.div
          className="absolute top-0 left-1/2 w-2 h-2 bg-cyan-400 rounded-full -translate-x-1/2 shadow-lg"
          animate={{ rotate: 360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear'
          }}
          style={{ 
            transformOrigin: `0 ${sizes[size] === 'w-8 h-8' ? '16px' : sizes[size] === 'w-12 h-12' ? '24px' : '32px'}`,
            boxShadow: '0 0 8px rgba(0, 212, 255, 0.8)'
          }}
        />
        
        <motion.div
          className="absolute top-1/2 right-0 w-2 h-2 bg-purple-400 rounded-full -translate-y-1/2 shadow-lg"
          animate={{ rotate: -360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear'
          }}
          style={{ 
            transformOrigin: `${sizes[size] === 'w-8 h-8' ? '-16px' : sizes[size] === 'w-12 h-12' ? '-24px' : '-32px'} 0`,
            boxShadow: '0 0 8px rgba(147, 51, 234, 0.8)'
          }}
        />
        
        <motion.div
          className="absolute bottom-0 left-1/2 w-1.5 h-1.5 bg-pink-400 rounded-full -translate-x-1/2 shadow-lg"
          animate={{ rotate: 360 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear'
          }}
          style={{ 
            transformOrigin: `0 ${sizes[size] === 'w-8 h-8' ? '-16px' : sizes[size] === 'w-12 h-12' ? '-24px' : '-32px'}`,
            boxShadow: '0 0 6px rgba(244, 114, 182, 0.8)'
          }}
        />
      </div>
    </motion.div>
  )
}