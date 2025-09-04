'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'

// Dynamically import the 3D component to avoid SSR issues
const Orbital3DVisualization = dynamic(
  () => import('./Orbital3DVisualization').then(mod => ({ default: mod.Orbital3DVisualization })),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }
)

interface Dynamic3DVisualizationProps {
  isActive: boolean
  onClose: () => void
}

export function Dynamic3DVisualization({ isActive, onClose }: Dynamic3DVisualizationProps) {
  if (!isActive) return null

  return <Orbital3DVisualization isActive={isActive} onClose={onClose} />
}