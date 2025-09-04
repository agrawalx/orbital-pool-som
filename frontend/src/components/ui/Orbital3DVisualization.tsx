'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'

interface Orbital3DVisualizationProps {
  className?: string
  isActive?: boolean
  onClose?: () => void
}

export function Orbital3DVisualization({ 
  className = '', 
  isActive = false, 
  onClose 
}: Orbital3DVisualizationProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const [isRotating, setIsRotating] = useState(true)
  const [viewMode, setViewMode] = useState<'sphere' | 'orbital' | 'network'>('sphere')

  // Liquidity data for 3D positioning
  const liquidityData = [
    { token: 'USDC', amount: 1250000, color: 0xf97316, position: [2, 0, 0] },
    { token: 'USDT', amount: 980000, color: 0xf59e0b, position: [1.4, 1.4, 0] },
    { token: 'DAI', amount: 750000, color: 0xeab308, position: [0, 2, 0] },
    { token: 'FRAX', amount: 420000, color: 0xca8a04, position: [-1.4, 1.4, 0] },
    { token: 'LUSD', amount: 140000, color: 0xa16207, position: [-2, 0, 0] }
  ]

  useEffect(() => {
    if (!mountRef.current || !isActive) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0f)
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75, 
      mountRef.current.clientWidth / mountRef.current.clientHeight, 
      0.1, 
      1000
    )
    camera.position.set(5, 3, 5)
    camera.lookAt(0, 0, 0)

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mountRef.current.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xf97316, 1)
    directionalLight.position.set(5, 5, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    const pointLight = new THREE.PointLight(0xf59e0b, 0.8, 100)
    pointLight.position.set(0, 0, 0)
    scene.add(pointLight)

    // Central sphere (AMM core)
    const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32)
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.8,
      emissive: 0xf97316,
      emissiveIntensity: 0.2
    })
    const centralSphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    centralSphere.castShadow = true
    centralSphere.receiveShadow = true
    scene.add(centralSphere)

    // Orbital rings
    const ringGroup = new THREE.Group()
    for (let i = 1; i <= 4; i++) {
      const ringGeometry = new THREE.RingGeometry(i * 0.8, i * 0.8 + 0.02, 64)
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0.3 - i * 0.05,
        side: THREE.DoubleSide
      })
      const ring = new THREE.Mesh(ringGeometry, ringMaterial)
      ring.rotation.x = Math.PI / 2
      ringGroup.add(ring)

      // Add vertical rings for 3D effect
      const verticalRing = ring.clone()
      verticalRing.rotation.x = 0
      verticalRing.rotation.y = Math.PI / 2
      ringGroup.add(verticalRing)
    }
    scene.add(ringGroup)

    // Liquidity nodes
    const nodeGroup = new THREE.Group()
    const nodes: THREE.Mesh[] = []
    const nodeLabels: THREE.Sprite[] = []

    liquidityData.forEach((data, index) => {
      // Node sphere
      const nodeGeometry = new THREE.SphereGeometry(0.15 + (data.amount / 2000000) * 0.1, 16, 16)
      const nodeMaterial = new THREE.MeshPhongMaterial({
        color: data.color,
        emissive: data.color,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.9
      })
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial)
      node.position.set(...data.position as [number, number, number])
      node.castShadow = true
      node.receiveShadow = true
      nodeGroup.add(node)
      nodes.push(node)

      // Node glow effect
      const glowGeometry = new THREE.SphereGeometry(0.25 + (data.amount / 2000000) * 0.15, 16, 16)
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: data.color,
        transparent: true,
        opacity: 0.2
      })
      const glow = new THREE.Mesh(glowGeometry, glowMaterial)
      glow.position.copy(node.position)
      nodeGroup.add(glow)

      // Text label
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      canvas.width = 256
      canvas.height = 64
      context.fillStyle = '#ffffff'
      context.font = 'bold 24px Arial'
      context.textAlign = 'center'
      context.fillText(data.token, 128, 32)
      context.fillStyle = '#fb923c'
      context.font = '16px Arial'
      context.fillText(`$${(data.amount / 1000).toFixed(0)}K`, 128, 52)

      const texture = new THREE.CanvasTexture(canvas)
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true })
      const sprite = new THREE.Sprite(spriteMaterial)
      sprite.position.set(data.position[0], data.position[1] + 0.5, data.position[2])
      sprite.scale.set(1, 0.25, 1)
      nodeGroup.add(sprite)
      nodeLabels.push(sprite)

      // Connecting lines to center
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(...data.position as [number, number, number])
      ])
      const lineMaterial = new THREE.LineBasicMaterial({
        color: data.color,
        transparent: true,
        opacity: 0.4
      })
      const line = new THREE.Line(lineGeometry, lineMaterial)
      nodeGroup.add(line)
    })

    scene.add(nodeGroup)

    // Particle system for ambient effects
    const particleCount = 200
    const particleGeometry = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)
    const particleColors = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      particlePositions[i3] = (Math.random() - 0.5) * 20
      particlePositions[i3 + 1] = (Math.random() - 0.5) * 20
      particlePositions[i3 + 2] = (Math.random() - 0.5) * 20

      const color = new THREE.Color(0xf97316)
      particleColors[i3] = color.r
      particleColors[i3 + 1] = color.g
      particleColors[i3 + 2] = color.b
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3))

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.6
    })

    const particles = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particles)

    // Mouse controls
    let mouseX = 0
    let mouseY = 0
    let targetRotationX = 0
    let targetRotationY = 0

    const handleMouseMove = (event: MouseEvent) => {
      if (!mountRef.current) return
      const rect = mountRef.current.getBoundingClientRect()
      mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1
      targetRotationX = mouseY * 0.5
      targetRotationY = mouseX * 0.5
    }

    mountRef.current.addEventListener('mousemove', handleMouseMove)

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)

      // Rotate central sphere
      centralSphere.rotation.y += 0.01
      centralSphere.rotation.x += 0.005

      // Rotate orbital rings
      ringGroup.rotation.y += isRotating ? 0.005 : 0
      ringGroup.rotation.x += isRotating ? 0.002 : 0

      // Animate nodes in orbital motion
      nodes.forEach((node, index) => {
        const time = Date.now() * 0.001
        const radius = Math.sqrt(
          liquidityData[index].position[0] ** 2 + 
          liquidityData[index].position[1] ** 2
        )
        const angle = time * (0.2 + index * 0.1) + index * (Math.PI * 2 / nodes.length)
        
        if (isRotating) {
          node.position.x = Math.cos(angle) * radius
          node.position.z = Math.sin(angle) * radius
          node.position.y = liquidityData[index].position[1] + Math.sin(time + index) * 0.2
        }

        // Update label positions
        if (nodeLabels[index]) {
          nodeLabels[index].position.copy(node.position)
          nodeLabels[index].position.y += 0.5
        }
      })

      // Animate particles
      const positions = particles.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        positions[i3 + 1] += Math.sin(Date.now() * 0.001 + i) * 0.01
      }
      particles.geometry.attributes.position.needsUpdate = true

      // Camera controls
      if (!isRotating) {
        camera.position.x += (targetRotationY * 8 - camera.position.x) * 0.05
        camera.position.y += (targetRotationX * 8 - camera.position.y) * 0.05
        camera.lookAt(0, 0, 0)
      } else {
        const time = Date.now() * 0.0005
        camera.position.x = Math.cos(time) * 8
        camera.position.z = Math.sin(time) * 8
        camera.position.y = 3 + Math.sin(time * 0.5) * 2
        camera.lookAt(0, 0, 0)
      }

      renderer.render(scene, camera)
    }

    animate()

    // Store refs
    sceneRef.current = scene
    rendererRef.current = renderer
    cameraRef.current = camera

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      if (mountRef.current) {
        mountRef.current.removeEventListener('mousemove', handleMouseMove)
      }
      renderer.dispose()
      scene.clear()
    }
  }, [isActive, isRotating, viewMode])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return
      
      const width = mountRef.current.clientWidth
      const height = mountRef.current.clientHeight
      
      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!isActive) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 ${className}`}
      >
        <motion.div
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          className="relative w-full max-w-6xl h-full max-h-[80vh] bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 p-6 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-orange-300 flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    🌌
                  </motion.div>
                  3D Orbital Liquidity Visualization
                </h2>
                <p className="text-orange-400/70 text-sm mt-1">
                  Interactive 3D representation of the spherical AMM protocol
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-300 hover:bg-orange-500/30 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 3D Canvas */}
          <div ref={mountRef} className="w-full h-full" />

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex flex-wrap justify-between items-center gap-4">
              {/* View Controls */}
              <div className="flex gap-2">
                <motion.button
                  onClick={() => setIsRotating(!isRotating)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isRotating
                      ? 'bg-orange-500 text-white'
                      : 'bg-orange-500/20 border border-orange-500/30 text-orange-300 hover:bg-orange-500/30'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isRotating ? '⏸️ Pause' : '▶️ Auto Rotate'}
                </motion.button>
                
                <motion.button
                  onClick={() => setViewMode(viewMode === 'sphere' ? 'orbital' : 'sphere')}
                  className="px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-300 hover:bg-orange-500/30 transition-colors text-sm font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🔄 Switch View
                </motion.button>
              </div>

              {/* Info */}
              <div className="text-xs text-orange-400/70 space-y-1">
                <div>💡 Mouse: Rotate camera (when paused)</div>
                <div>🎯 Spheres: Liquidity pools with real-time data</div>
                <div>⚡ Center: AMM core with K = ||r||² invariant</div>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-xs">
                <div className="text-center">
                  <div className="text-orange-300 font-semibold">$3.75M</div>
                  <div className="text-orange-400/70">Total Liquidity</div>
                </div>
                <div className="text-center">
                  <div className="text-orange-300 font-semibold">5</div>
                  <div className="text-orange-400/70">Active Pools</div>
                </div>
                <div className="text-center">
                  <div className="text-orange-300 font-semibold">3.2x</div>
                  <div className="text-orange-400/70">Avg Efficiency</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}