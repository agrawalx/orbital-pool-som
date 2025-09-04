'use client'

import { motion } from 'framer-motion'

export function GeometricBackground() {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Animated Grid Lines - Similar to Unite DeFi */}
            <div className="absolute inset-0">
                {/* Vertical Lines */}
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={`v-${i}`}
                        className="absolute w-px bg-gradient-to-b from-transparent via-orange-500/20 to-transparent"
                        style={{
                            left: `${(i * 5)}%`,
                            height: '100%'
                        }}
                        animate={{
                            opacity: [0.1, 0.3, 0.1],
                            scaleY: [0.8, 1.2, 0.8]
                        }}
                        transition={{
                            duration: 4 + Math.random() * 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.2
                        }}
                    />
                ))}
                
                {/* Horizontal Lines */}
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={`h-${i}`}
                        className="absolute h-px bg-gradient-to-r from-transparent via-orange-500/15 to-transparent"
                        style={{
                            top: `${(i * 6.67)}%`,
                            width: '100%'
                        }}
                        animate={{
                            opacity: [0.1, 0.25, 0.1],
                            scaleX: [0.9, 1.1, 0.9]
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.15
                        }}
                    />
                ))}
            </div>

            {/* Large Geometric Shapes */}
            <motion.div
                className="absolute top-1/4 right-1/6 w-64 h-64"
                animate={{
                    rotate: 360,
                    scale: [0.9, 1.1, 0.9]
                }}
                transition={{
                    rotate: { duration: 60, repeat: Infinity, ease: "linear" },
                    scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
                }}
                style={{
                    background: `conic-gradient(from 0deg, 
                        rgba(255, 165, 0, 0.05) 0deg,
                        rgba(255, 69, 0, 0.08) 90deg,
                        rgba(255, 165, 0, 0.05) 180deg,
                        rgba(255, 140, 0, 0.08) 270deg,
                        rgba(255, 165, 0, 0.05) 360deg
                    )`,
                    borderRadius: '50%',
                    border: '1px solid rgba(255, 165, 0, 0.1)'
                }}
            />

            {/* Hexagonal Pattern */}
            <motion.div
                className="absolute bottom-1/4 left-1/6 w-48 h-48"
                animate={{
                    rotate: -360,
                    opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                    rotate: { duration: 45, repeat: Infinity, ease: "linear" },
                    opacity: { duration: 6, repeat: Infinity, ease: "easeInOut" }
                }}
                style={{
                    background: `linear-gradient(60deg, 
                        rgba(255, 165, 0, 0.06) 0%,
                        transparent 50%,
                        rgba(255, 69, 0, 0.06) 100%
                    )`,
                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                    border: '1px solid rgba(255, 165, 0, 0.08)'
                }}
            />

            {/* Orbital Rings - Representing AMM Mechanics */}
            <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            >
                {/* Outer Ring */}
                <div
                    className="absolute border border-orange-500/20 rounded-full"
                    style={{
                        width: '400px',
                        height: '400px',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    {/* Orbiting Elements */}
                    {[0, 72, 144, 216, 288].map((angle, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-red-500"
                            style={{
                                top: '50%',
                                left: '50%',
                                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-200px)`,
                                boxShadow: '0 0 10px rgba(255, 165, 0, 0.6)'
                            }}
                            animate={{ rotate: -360 }}
                            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                        />
                    ))}
                </div>

                {/* Middle Ring */}
                <div
                    className="absolute border border-orange-500/15 rounded-full"
                    style={{
                        width: '280px',
                        height: '280px',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    {[0, 90, 180, 270].map((angle, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
                            style={{
                                top: '50%',
                                left: '50%',
                                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-140px)`,
                                boxShadow: '0 0 8px rgba(255, 193, 7, 0.6)'
                            }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        />
                    ))}
                </div>

                {/* Inner Ring */}
                <div
                    className="absolute border border-orange-500/10 rounded-full"
                    style={{
                        width: '160px',
                        height: '160px',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    {[0, 120, 240].map((angle, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-red-400 to-pink-500"
                            style={{
                                top: '50%',
                                left: '50%',
                                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-80px)`,
                                boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)'
                            }}
                            animate={{ rotate: -360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        />
                    ))}
                </div>
            </motion.div>

            {/* Floating Data Points */}
            {[...Array(15)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    initial={{
                        opacity: 0,
                        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                        y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                    }}
                    animate={{
                        opacity: [0, 0.8, 0],
                        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                        y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                        scale: [0.5, 1.5, 0.5]
                    }}
                    transition={{
                        duration: 12 + Math.random() * 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.8
                    }}
                    style={{
                        background: `radial-gradient(circle, 
                            ${i % 4 === 0 ? 'rgba(255, 165, 0, 0.8)' : 
                              i % 4 === 1 ? 'rgba(255, 69, 0, 0.8)' : 
                              i % 4 === 2 ? 'rgba(255, 140, 0, 0.8)' :
                              'rgba(255, 193, 7, 0.8)'} 0%, 
                            transparent 70%
                        )`,
                        boxShadow: `0 0 8px ${
                            i % 4 === 0 ? 'rgba(255, 165, 0, 0.4)' : 
                            i % 4 === 1 ? 'rgba(255, 69, 0, 0.4)' : 
                            i % 4 === 2 ? 'rgba(255, 140, 0, 0.4)' :
                            'rgba(255, 193, 7, 0.4)'
                        }`
                    }}
                />
            ))}

            {/* Connecting Lines Animation */}
            <svg className="absolute inset-0 w-full h-full">
                <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(255, 165, 0, 0)" />
                        <stop offset="50%" stopColor="rgba(255, 165, 0, 0.3)" />
                        <stop offset="100%" stopColor="rgba(255, 165, 0, 0)" />
                    </linearGradient>
                </defs>
                
                {/* Animated connecting lines */}
                {[...Array(8)].map((_, i) => (
                    <motion.line
                        key={i}
                        x1={`${Math.random() * 100}%`}
                        y1={`${Math.random() * 100}%`}
                        x2={`${Math.random() * 100}%`}
                        y2={`${Math.random() * 100}%`}
                        stroke="url(#lineGradient)"
                        strokeWidth="1"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ 
                            pathLength: [0, 1, 0],
                            opacity: [0, 0.6, 0]
                        }}
                        transition={{
                            duration: 6 + Math.random() * 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 1.5
                        }}
                    />
                ))}
            </svg>

            {/* Ambient Glow */}
            <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.03, 0.08, 0.03]
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{
                    background: `radial-gradient(circle, 
                        rgba(255, 165, 0, 0.06) 0%, 
                        rgba(255, 69, 0, 0.04) 30%, 
                        rgba(255, 140, 0, 0.02) 60%,
                        transparent 100%
                    )`,
                    filter: 'blur(80px)'
                }}
            />
        </div>
    )
}