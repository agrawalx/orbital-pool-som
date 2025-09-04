/**
 * Orbital AMM - Premium Visual Effects
 * 
 * Advanced visual effects and animations for premium user experience.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * Floating particles background effect
 */
export function ParticleField() {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    duration: number;
  }>>([]);

  useEffect(() => {
    const generateParticles = () => {
      const colors = ['#00d4ff', '#ff0080', '#7c3aed', '#00ff88'];
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        duration: Math.random() * 8 + 8,
      }));
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full opacity-30"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
          }}
          initial={{
            x: `${particle.x}vw`,
            y: `${particle.y}vh`,
          }}
          animate={{
            x: [`${particle.x}vw`, `${(particle.x + 20) % 100}vw`],
            y: [`${particle.y}vh`, `${(particle.y + 15) % 100}vh`],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Neural network background animation
 */
export function NeuralNetwork() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <svg
        className="w-full h-full opacity-10"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#ff0080" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        
        {/* Neural connections */}
        <motion.path
          d="M100,200 Q300,100 500,200 T900,200"
          stroke="url(#neuralGradient)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path
          d="M150,400 Q350,300 550,400 T950,400"
          stroke="url(#neuralGradient)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.path
          d="M50,600 Q250,500 450,600 T850,600"
          stroke="url(#neuralGradient)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />
        
        {/* Neural nodes */}
        {[
          { x: 100, y: 200 }, { x: 500, y: 200 }, { x: 900, y: 200 },
          { x: 150, y: 400 }, { x: 550, y: 400 }, { x: 950, y: 400 },
          { x: 50, y: 600 }, { x: 450, y: 600 }, { x: 850, y: 600 },
        ].map((node, index) => (
          <motion.circle
            key={index}
            cx={node.x}
            cy={node.y}
            r="4"
            fill="url(#neuralGradient)"
            animate={{
              r: [4, 8, 4],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.2,
            }}
          />
        ))}
      </svg>
    </div>
  );
}

/**
 * Holographic card wrapper
 */
interface HoloCardProps {
  children: React.ReactNode;
  className?: string;
}

export function HoloCard({ children, className = '' }: HoloCardProps) {
  return (
    <motion.div
      className={`holo-card ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Quantum button with advanced effects
 */
interface QuantumButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
}

export function QuantumButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  className = '',
}: QuantumButtonProps) {
  const variants = {
    primary: 'from-blue-500/20 via-purple-500/20 to-pink-500/20 border-blue-500/50',
    secondary: 'from-gray-500/20 via-slate-500/20 to-gray-500/20 border-gray-500/50',
    danger: 'from-red-500/20 via-orange-500/20 to-red-500/20 border-red-500/50',
  };

  return (
    <motion.button
      className={`quantum-button bg-gradient-to-r ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <div className="quantum-loader w-4 h-4" />
            <span>Processing...</span>
          </motion.div>
        ) : (
          <motion.span
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/**
 * Data stream animation component
 */
export function DataStream({ className = '' }: { className?: string }) {
  return (
    <div className={`data-stream ${className}`}>
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>
    </div>
  );
}

/**
 * Floating notification component
 */
interface NotificationProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose?: () => void;
}

export function FloatingNotification({ message, type = 'info', onClose }: NotificationProps) {
  const colors = {
    success: 'border-green-500/50 bg-green-500/10',
    error: 'border-red-500/50 bg-red-500/10',
    info: 'border-blue-500/50 bg-blue-500/10',
    warning: 'border-yellow-500/50 bg-yellow-500/10',
  };

  useEffect(() => {
    if (onClose) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [onClose]);

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      className={`notification ${colors[type]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-white/60 hover:text-white transition-colors"
          >
            ×
          </button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Advanced loading spinner
 */
export function QuantumLoader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  return (
    <div className={`quantum-loader ${sizes[size]} mx-auto`}>
      <motion.div
        className="absolute inset-0 border-2 border-transparent border-t-cyan-400 border-r-cyan-400 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-2 border-2 border-transparent border-t-pink-400 border-l-pink-400 rounded-full"
        animate={{ rotate: -360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-4 border-2 border-transparent border-t-purple-400 border-b-purple-400 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

/**
 * Cyberpunk text effect
 */
interface CyberTextProps {
  children: React.ReactNode;
  className?: string;
  glitch?: boolean;
}

export function CyberText({ children, className = '', glitch = false }: CyberTextProps) {
  return (
    <motion.span
      className={`cyber-text ${glitch ? 'animate-pulse' : ''} ${className}`}
      animate={glitch ? {
        textShadow: [
          '0 0 5px #00d4ff, 0 0 10px #00d4ff, 0 0 15px #00d4ff',
          '2px 0 0 #ff0080, -2px 0 0 #00d4ff',
          '0 0 5px #00d4ff, 0 0 10px #00d4ff, 0 0 15px #00d4ff',
        ],
      } : {}}
      transition={glitch ? { duration: 0.1, repeat: Infinity } : {}}
    >
      {children}
    </motion.span>
  );
}