/**
 * Orbital AMM - Premium Loading Screen
 * 
 * Sophisticated loading screen with orbital animations and progress tracking.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Zap, Activity, Wifi, CheckCircle } from 'lucide-react';

interface LoadingScreenProps {
  isLoading: boolean;
  onComplete?: () => void;
}

export function LoadingScreen({ isLoading, onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: 'Initializing Protocol', icon: Zap, duration: 800 },
    { label: 'Connecting to Arbitrum', icon: Wifi, duration: 600 },
    { label: 'Loading Pool Data', icon: Activity, duration: 700 },
    { label: 'Calculating Orbits', icon: CheckCircle, duration: 500 },
  ];

  useEffect(() => {
    if (!isLoading) return;

    let totalDuration = 0;
    const intervals: NodeJS.Timeout[] = [];

    steps.forEach((step, index) => {
      const timer = setTimeout(() => {
        setCurrentStep(index);
        
        // Animate progress for this step
        const stepProgress = ((index + 1) / steps.length) * 100;
        const progressTimer = setInterval(() => {
          setProgress(prev => {
            const newProgress = Math.min(prev + 2, stepProgress);
            if (newProgress >= stepProgress) {
              clearInterval(progressTimer);
            }
            return newProgress;
          });
        }, 20);
        
        intervals.push(progressTimer);
      }, totalDuration);
      
      intervals.push(timer);
      totalDuration += step.duration;
    });

    // Complete loading
    const completeTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        onComplete?.();
      }, 500);
    }, totalDuration);

    intervals.push(completeTimer);

    return () => {
      intervals.forEach(clearTimeout);
    };
  }, [isLoading, onComplete]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
        >
          {/* Background Effects */}
          <div className="absolute inset-0">
            {/* Orbital Rings */}
            <motion.div
              className="absolute top-1/2 left-1/2 w-96 h-96 border border-orange-500/20 rounded-full"
              style={{ transform: 'translate(-50%, -50%)' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 w-80 h-80 border border-orange-500/15 rounded-full"
              style={{ transform: 'translate(-50%, -50%)' }}
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 w-64 h-64 border border-orange-500/10 rounded-full"
              style={{ transform: 'translate(-50%, -50%)' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            />

            {/* Floating Particles */}
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-orange-400/30 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Main Content */}
          <div className="relative z-10 text-center space-y-8">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="relative"
            >
              <div className="w-24 h-24 mx-auto bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 border-4 border-white/80 rounded-full"
                />
              </div>
              <motion.div
                className="absolute inset-0 w-24 h-24 mx-auto border-2 border-orange-400/50 rounded-2xl"
                animate={{ rotate: -360, scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-4xl font-bold text-white mb-2">
                Orbital AMM
              </h1>
              <p className="text-orange-300/70 text-lg font-mono tracking-wider">
                SPHERICAL LIQUIDITY PROTOCOL
              </p>
            </motion.div>

            {/* Current Step */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  {steps[currentStep] && React.createElement(steps[currentStep].icon, { className: "w-6 h-6 text-orange-400" })}
                </motion.div>
                <span className="text-white font-medium">
                  {steps[currentStep]?.label || 'Loading...'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-80 mx-auto">
                <div className="flex justify-between text-sm text-orange-300/70 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Step Indicators */}
              <div className="flex justify-center gap-2 mt-6">
                {steps.map((step, index) => (
                  <motion.div
                    key={index}
                    className={`w-3 h-3 rounded-full border-2 ${
                      index <= currentStep
                        ? 'bg-orange-500 border-orange-500'
                        : 'border-orange-500/30'
                    }`}
                    animate={index === currentStep ? {
                      scale: [1, 1.3, 1],
                      boxShadow: [
                        '0 0 0 rgba(249, 115, 22, 0)',
                        '0 0 20px rgba(249, 115, 22, 0.5)',
                        '0 0 0 rgba(249, 115, 22, 0)',
                      ],
                    } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Loading Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-orange-300/50 text-sm font-mono"
            >
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Initializing spherical mathematics...
              </motion.span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Simple orbital loader for inline use
 */
export function OrbitalLoader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className={`relative ${sizes[size]} mx-auto`}>
      <motion.div
        className="absolute inset-0 border-2 border-orange-500/30 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-1 border-2 border-orange-500/50 rounded-full"
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-2 border-2 border-orange-500 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-2 h-2 bg-orange-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
        animate={{ scale: [1, 1.5, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </div>
  );
}