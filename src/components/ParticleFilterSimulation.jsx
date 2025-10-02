import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

const ParticleFilterSimulation = forwardRef((props, ref) => {
  const {
    isRunning,
    numFilterParticles,
    numMicroParticles,
    simulationSpeed,
    showFilterParticles,
    showMicroParticles,
    showTarget,
    scenario,
    advancedSettings
  } = props

  const canvasRef = useRef(null)
  const animationFrameRef = useRef(null)
  const lastFrameTimeRef = useRef(performance.now())
  const fpsCounterRef = useRef({ frames: 0, lastTime: performance.now(), fps: 0 })
  const recordingFramesRef = useRef([])
  const isRecordingRef = useRef(false)
  const trajectoryRef = useRef([])
  
  const simulationStateRef = useRef({
    microParticles: [],
    filterParticles: [],
    targetParticles: [],
    walls: [],
    wallMap: null,
    isDrawing: false,
    lastPoint: null,
    imgSize: 600,
    wallThickness: 8,
    targetCenter: { x: 300, y: 300 },
    estimate: { x: 300, y: 300 }
  })

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    reset: () => {
      initializeSimulation()
      trajectoryRef.current = []
    },
    clearWalls: () => {
      const state = simulationStateRef.current
      state.walls = []
      state.wallMap = new Uint8Array(state.imgSize * state.imgSize)
    },
    regenerateParticles: () => {
      const state = simulationStateRef.current
      state.microParticles = initializeMicroParticles(state.imgSize, numMicroParticles)
    },
    exportData: () => {
      const state = simulationStateRef.current
      const data = {
        timestamp: new Date().toISOString(),
        targetPosition: state.targetCenter,
        filterEstimate: state.estimate,
        trackingError: calculateTrackingError(),
        trajectory: trajectoryRef.current,
        numParticles: {
          filter: state.filterParticles.length,
          micro: state.microParticles.length,
          target: state.targetParticles.length
        },
        metrics: {
          fps: fpsCounterRef.current.fps,
          effectiveParticles: calculateEffectiveParticles(),
          convergenceRate: calculateConvergenceRate()
        }
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `particle-filter-data-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    },
    takeScreenshot: () => {
      const canvas = canvasRef.current
      if (!canvas) return
      
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `particle-filter-screenshot-${Date.now()}.png`
        a.click()
        URL.revokeObjectURL(url)
      })
    },
    startRecording: () => {
      isRecordingRef.current = true
      recordingFramesRef.current = []
    },
    stopRecording: () => {
      isRecordingRef.current = false
      if (recordingFramesRef.current.length > 0) {
        // Create a simple animation by downloading frames
        // In a real implementation, you would use a library to create GIF/video
        console.log(`Recorded ${recordingFramesRef.current.length} frames`)
        alert(`Gravação concluída! ${recordingFramesRef.current.length} frames capturados.\n\nNota: A exportação completa para GIF/vídeo requer bibliotecas adicionais.`)
        recordingFramesRef.current = []
      }
    },
    getMetrics: () => {
      return {
        fps: fpsCounterRef.current.fps,
        trackingError: calculateTrackingError(),
        effectiveParticles: calculateEffectiveParticles(),
        convergenceRate: calculateConvergenceRate()
      }
    }
  }))

  // Calculate tracking error
  const calculateTrackingError = () => {
    const state = simulationStateRef.current
    const dx = state.estimate.x - state.targetCenter.x
    const dy = state.estimate.y - state.targetCenter.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  // Calculate effective particles
  const calculateEffectiveParticles = () => {
    const state = simulationStateRef.current
    const particles = state.filterParticles
    if (particles.length === 0) return 0
    
    const totalWeight = particles.reduce((sum, p) => sum + p.weight, 0)
    if (totalWeight === 0) return 0
    
    const sumSquaredWeights = particles.reduce((sum, p) => {
      const normalizedWeight = p.weight / totalWeight
      return sum + normalizedWeight * normalizedWeight
    }, 0)
    
    return sumSquaredWeights > 0 ? 1 / sumSquaredWeights : 0
  }

  // Calculate convergence rate
  const calculateConvergenceRate = () => {
    const effectiveParticles = calculateEffectiveParticles()
    const state = simulationStateRef.current
    const maxParticles = state.filterParticles.length
    return maxParticles > 0 ? effectiveParticles / maxParticles : 0
  }

  // Initialize micro particles
  const initializeMicroParticles = (imgSize, count) => {
    const particles = []
    const particleColors = [
      [0.2, 0.4, 1.0],
      [0.0, 0.8, 1.0],
      [0.4, 0.2, 1.0],
      [0.6, 0.0, 1.0],
    ]
    
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * (imgSize - 10) + 5,
        y: Math.random() * (imgSize - 10) + 5,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size: Math.random() * 1.5 + 0.5,
        type: Math.floor(Math.random() * 4),
        life: Math.random() * 0.7 + 0.3,
        phase: Math.random() * Math.PI * 2,
        color: particleColors[Math.floor(Math.random() * 4)]
      })
    }
    return particles
  }

  // Initialize target particles
  const initializeTargetParticles = (imgSize) => {
    const centerX = imgSize / 2
    const centerY = imgSize / 2
    const particles = []
    
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const radius = Math.random() * 5 + 8
      particles.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 2 + 3,
        angle: angle,
        baseRadius: radius
      })
    }
    return particles
  }

  // Initialize filter particles
  const initializeFilterParticles = (imgSize, count) => {
    const particles = []
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * imgSize * 0.3
      particles.push({
        x: imgSize / 2 + radius * Math.cos(angle),
        y: imgSize / 2 + radius * Math.sin(angle),
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        weight: 1.0,
        radius: Math.random() * 2 + 2
      })
    }
    return particles
  }

  // Initialize simulation
  const initializeSimulation = () => {
    const state = simulationStateRef.current
    state.microParticles = initializeMicroParticles(state.imgSize, numMicroParticles)
    state.targetParticles = initializeTargetParticles(state.imgSize)
    state.filterParticles = initializeFilterParticles(state.imgSize, numFilterParticles)
    state.walls = []
    state.wallMap = new Uint8Array(state.imgSize * state.imgSize)
    
    // Apply scenario-specific walls
    applyScenarioWalls(scenario)
  }

  // Apply scenario-specific walls
  const applyScenarioWalls = (scenarioId) => {
    const state = simulationStateRef.current
    const imgSize = state.imgSize
    
    state.walls = []
    state.wallMap = new Uint8Array(imgSize * imgSize)
    
    if (scenarioId === 'obstacles') {
      drawWallLine(100, 100, 300, 100)
      drawWallLine(300, 200, 500, 200)
      drawWallLine(200, 300, 200, 500)
      drawWallLine(400, 300, 400, 500)
    } else if (scenarioId === 'dispersion') {
      drawWallLine(150, 250, 450, 250)
      drawWallLine(300, 100, 300, 200)
      drawWallLine(300, 300, 300, 500)
    } else if (scenarioId === 'traffic') {
      drawWallLine(50, 200, 550, 200)
      drawWallLine(50, 400, 550, 400)
      drawWallLine(250, 50, 250, 550)
      drawWallLine(350, 50, 350, 550)
    }
  }

  // Draw wall line
  const drawWallLine = (x1, y1, x2, y2) => {
    const state = simulationStateRef.current
    const dx = x2 - x1
    const dy = y2 - y1
    const steps = Math.max(Math.abs(dx), Math.abs(dy))
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = Math.round(x1 + dx * t)
      const y = Math.round(y1 + dy * t)
      addWallPoint(x, y)
    }
  }

  // Add wall point
  const addWallPoint = (x, y) => {
    const state = simulationStateRef.current
    const thickness = state.wallThickness
    const imgSize = state.imgSize
    
    for (let i = -thickness / 2; i <= thickness / 2; i++) {
      for (let j = -thickness / 2; j <= thickness / 2; j++) {
        const wallX = Math.max(0, Math.min(imgSize - 1, Math.round(x + i)))
        const wallY = Math.max(0, Math.min(imgSize - 1, Math.round(y + j)))
        state.wallMap[wallY * imgSize + wallX] = 1
      }
    }
  }

  // Check wall collision
  const checkWallCollision = (x, y, radius = 1) => {
    const state = simulationStateRef.current
    const imgSize = state.imgSize
    const xInt = Math.round(x)
    const yInt = Math.round(y)
    const radiusInt = Math.round(radius)
    
    if (xInt < radiusInt || xInt >= imgSize - radiusInt || 
        yInt < radiusInt || yInt >= imgSize - radiusInt) {
      return true
    }
    
    for (let i = -radiusInt; i <= radiusInt; i++) {
      for (let j = -radiusInt; j <= radiusInt; j++) {
        const checkX = Math.max(0, Math.min(imgSize - 1, xInt + i))
        const checkY = Math.max(0, Math.min(imgSize - 1, yInt + j))
        if (state.wallMap[checkY * imgSize + checkX] === 1) {
          return true
        }
      }
    }
    return false
  }

  // Update micro particles
  const updateMicroParticles = (deltaTime) => {
    const state = simulationStateRef.current
    const particles = state.microParticles
    const imgSize = state.imgSize
    
    particles.forEach(particle => {
      particle.vx += (Math.random() - 0.5) * 0.1
      particle.vy += (Math.random() - 0.5) * 0.1
      
      const maxSpeed = 0.8
      const speed = Math.sqrt(particle.vx ** 2 + particle.vy ** 2)
      if (speed > maxSpeed) {
        particle.vx = (particle.vx / speed) * maxSpeed
        particle.vy = (particle.vy / speed) * maxSpeed
      }
      
      let newX = particle.x + particle.vx * deltaTime
      let newY = particle.y + particle.vy * deltaTime
      
      if (checkWallCollision(newX, newY, particle.size)) {
        if (checkWallCollision(newX, particle.y, particle.size)) {
          particle.vx = -particle.vx * 0.7 + (Math.random() - 0.5) * 0.2
        }
        if (checkWallCollision(particle.x, newY, particle.size)) {
          particle.vy = -particle.vy * 0.7 + (Math.random() - 0.5) * 0.2
        }
      } else {
        particle.x = newX
        particle.y = newY
      }
      
      if (particle.x < 2 || particle.x > imgSize - 2) {
        particle.vx = -particle.vx * 0.8
        particle.x = Math.max(2, Math.min(imgSize - 2, particle.x))
      }
      if (particle.y < 2 || particle.y > imgSize - 2) {
        particle.vy = -particle.vy * 0.8
        particle.y = Math.max(2, Math.min(imgSize - 2, particle.y))
      }
      
      particle.phase += 0.1 * deltaTime
      particle.life = Math.max(0.1, particle.life + (Math.random() - 0.5) * 0.02)
      
      if (Math.random() < 0.001) {
        particle.x = Math.random() * (imgSize - 10) + 5
        particle.y = Math.random() * (imgSize - 10) + 5
        particle.vx = (Math.random() - 0.5) * 0.6
        particle.vy = (Math.random() - 0.5) * 0.6
        particle.life = Math.random() * 0.7 + 0.3
      }
    })
  }

  // Update target particles
  const updateTargetParticles = (deltaTime) => {
    const state = simulationStateRef.current
    const particles = state.targetParticles
    const imgSize = state.imgSize
    
    let centerX = 0, centerY = 0
    particles.forEach(p => {
      centerX += p.x
      centerY += p.y
    })
    centerX /= particles.length
    centerY /= particles.length
    
    state.targetCenter = { x: centerX, y: centerY }
    
    // Add to trajectory
    if (advancedSettings.showTrajectory) {
      trajectoryRef.current.push({ x: centerX, y: centerY, time: Date.now() })
      // Keep only last 100 points
      if (trajectoryRef.current.length > 100) {
        trajectoryRef.current.shift()
      }
    }
    
    const globalVx = (Math.random() - 0.5) * 0.6
    const globalVy = (Math.random() - 0.5) * 0.6
    
    particles.forEach(particle => {
      const cohesionX = (centerX - particle.x) * 0.02
      const cohesionY = (centerY - particle.y) * 0.02
      
      particle.angle += 0.02 * deltaTime
      const orbitalX = particle.baseRadius * Math.cos(particle.angle) * 0.01
      const orbitalY = particle.baseRadius * Math.sin(particle.angle) * 0.01
      
      const noiseX = (Math.random() - 0.5) * 0.1
      const noiseY = (Math.random() - 0.5) * 0.1
      
      particle.vx = globalVx + cohesionX + orbitalX + noiseX
      particle.vy = globalVy + cohesionY + orbitalY + noiseY
      
      let newX = particle.x + particle.vx * deltaTime
      let newY = particle.y + particle.vy * deltaTime
      
      if (checkWallCollision(newX, newY, particle.size)) {
        if (checkWallCollision(newX, particle.y, particle.size)) {
          particle.vx = -particle.vx * 0.8
        }
        if (checkWallCollision(particle.x, newY, particle.size)) {
          particle.vy = -particle.vy * 0.8
        }
      } else {
        particle.x = newX
        particle.y = newY
      }
      
      particle.x = Math.max(3, Math.min(imgSize - 3, particle.x))
      particle.y = Math.max(3, Math.min(imgSize - 3, particle.y))
    })
  }

  // Update filter particles
  const updateFilterParticles = (deltaTime) => {
    const state = simulationStateRef.current
    const particles = state.filterParticles
    const imgSize = state.imgSize
    const targetCenter = state.targetCenter
    const processNoise = advancedSettings.processNoise
    const observationNoise = advancedSettings.observationNoise
    
    particles.forEach(particle => {
      particle.x += particle.vx * deltaTime
      particle.y += particle.vy * deltaTime
      
      particle.vx += (Math.random() - 0.5) * processNoise
      particle.vy += (Math.random() - 0.5) * processNoise
      
      particle.vx *= 0.98
      particle.vy *= 0.98
      
      const maxSpeed = 1.5
      const speed = Math.sqrt(particle.vx ** 2 + particle.vy ** 2)
      if (speed > maxSpeed) {
        particle.vx = (particle.vx / speed) * maxSpeed
        particle.vy = (particle.vy / speed) * maxSpeed
      }
      
      const dx = particle.x - targetCenter.x
      const dy = particle.y - targetCenter.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      particle.weight = Math.exp(-distance * distance / (observationNoise * 100))
      
      particle.x = Math.max(5, Math.min(imgSize - 5, particle.x))
      particle.y = Math.max(5, Math.min(imgSize - 5, particle.y))
    })
    
    // Adaptive resampling
    if (advancedSettings.enableAdaptiveResampling) {
      const effectiveParticles = calculateEffectiveParticles()
      const threshold = particles.length * advancedSettings.resampleThreshold
      if (effectiveParticles < threshold) {
        resampleParticles()
      }
    } else if (Math.random() < 0.1) {
      resampleParticles()
    }
  }

  // Resample particles
  const resampleParticles = () => {
    const state = simulationStateRef.current
    const particles = state.filterParticles
    
    const totalWeight = particles.reduce((sum, p) => sum + p.weight, 0)
    if (totalWeight === 0) return
    
    particles.forEach(p => p.weight /= totalWeight)
    
    const newParticles = []
    const n = particles.length
    const step = 1 / n
    let u = Math.random() * step
    let c = particles[0].weight
    let i = 0
    
    for (let j = 0; j < n; j++) {
      while (u > c && i < n - 1) {
        i++
        c += particles[i].weight
      }
      newParticles.push({
        x: particles[i].x + (Math.random() - 0.5) * 5,
        y: particles[i].y + (Math.random() - 0.5) * 5,
        vx: particles[i].vx + (Math.random() - 0.5) * 0.2,
        vy: particles[i].vy + (Math.random() - 0.5) * 0.2,
        weight: 1.0,
        radius: particles[i].radius
      })
      u += step
    }
    
    state.filterParticles = newParticles
  }

  // Calculate filter estimate
  const calculateFilterEstimate = (particles) => {
    if (particles.length === 0) return { x: 0, y: 0 }
    
    const totalWeight = particles.reduce((sum, p) => sum + p.weight, 0)
    if (totalWeight === 0) return { x: 0, y: 0 }
    
    let x = 0, y = 0
    particles.forEach(p => {
      x += p.x * p.weight
      y += p.y * p.weight
    })
    
    return { x: x / totalWeight, y: y / totalWeight }
  }

  // Render simulation
  const render = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const state = simulationStateRef.current
    const imgSize = state.imgSize
    
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, imgSize, imgSize)
    
    // Draw heatmap if enabled
    if (advancedSettings.showHeatmap) {
      const heatmapData = new Uint8ClampedArray(imgSize * imgSize * 4)
      state.filterParticles.forEach(particle => {
        const px = Math.round(particle.x)
        const py = Math.round(particle.y)
        const radius = 20
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const x = px + dx
            const y = py + dy
            if (x >= 0 && x < imgSize && y >= 0 && y < imgSize) {
              const distance = Math.sqrt(dx * dx + dy * dy)
              if (distance <= radius) {
                const intensity = particle.weight * (1 - distance / radius) * 50
                const index = (y * imgSize + x) * 4
                heatmapData[index] += intensity // R
                heatmapData[index + 1] += intensity * 0.5 // G
                heatmapData[index + 2] += 0 // B
                heatmapData[index + 3] = 255 // A
              }
            }
          }
        }
      })
      const imageData = new ImageData(heatmapData, imgSize, imgSize)
      ctx.globalAlpha = 0.3
      ctx.putImageData(imageData, 0, 0)
      ctx.globalAlpha = 1.0
    }
    
    // Draw walls
    ctx.fillStyle = '#808080'
    for (let y = 0; y < imgSize; y++) {
      for (let x = 0; x < imgSize; x++) {
        if (state.wallMap[y * imgSize + x] === 1) {
          ctx.fillRect(x, y, 1, 1)
        }
      }
    }
    
    // Draw trajectory
    if (advancedSettings.showTrajectory && trajectoryRef.current.length > 1) {
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(trajectoryRef.current[0].x, trajectoryRef.current[0].y)
      for (let i = 1; i < trajectoryRef.current.length; i++) {
        ctx.lineTo(trajectoryRef.current[i].x, trajectoryRef.current[i].y)
      }
      ctx.stroke()
    }
    
    // Draw micro particles
    if (showMicroParticles) {
      state.microParticles.forEach(particle => {
        const intensity = particle.life * (0.5 + 0.5 * Math.sin(particle.phase))
        const alpha = intensity * 0.6
        const color = particle.color
        ctx.fillStyle = `rgba(${Math.floor(color[0] * 255)}, ${Math.floor(color[1] * 255)}, ${Math.floor(color[2] * 255)}, ${alpha})`
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
      })
    }
    
    // Draw filter particles
    if (showFilterParticles) {
      state.filterParticles.forEach(particle => {
        const alpha = advancedSettings.showParticleWeights 
          ? 0.2 + particle.weight * 0.8 
          : 0.3 + particle.weight * 0.5
        ctx.fillStyle = `rgba(51, 153, 255, ${alpha})`
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fill()
      })
    }
    
    // Draw target particles
    if (showTarget) {
      state.targetParticles.forEach(particle => {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.8)'
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
      })
    }
    
    // Draw filter estimate
    const estimate = calculateFilterEstimate(state.filterParticles)
    state.estimate = estimate
    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(estimate.x, estimate.y, 15, 0, Math.PI * 2)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(estimate.x - 10, estimate.y)
    ctx.lineTo(estimate.x + 10, estimate.y)
    ctx.moveTo(estimate.x, estimate.y - 10)
    ctx.lineTo(estimate.x, estimate.y + 10)
    ctx.stroke()
    
    // Record frame if recording
    if (isRecordingRef.current && recordingFramesRef.current.length < 300) {
      recordingFramesRef.current.push(canvas.toDataURL())
    }
  }

  // Update FPS counter
  const updateFPS = (currentTime) => {
    fpsCounterRef.current.frames++
    if (currentTime - fpsCounterRef.current.lastTime >= 1000) {
      fpsCounterRef.current.fps = fpsCounterRef.current.frames
      fpsCounterRef.current.frames = 0
      fpsCounterRef.current.lastTime = currentTime
    }
  }

  // Animation loop
  const animate = (timestamp) => {
    updateFPS(timestamp)
    
    if (!isRunning) {
      animationFrameRef.current = requestAnimationFrame(animate)
      return
    }
    
    const deltaTime = simulationSpeed
    
    updateMicroParticles(deltaTime)
    updateTargetParticles(deltaTime)
    updateFilterParticles(deltaTime)
    render()
    
    lastFrameTimeRef.current = timestamp
    animationFrameRef.current = requestAnimationFrame(animate)
  }

  // Mouse event handlers
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width))
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height))
    
    const state = simulationStateRef.current
    state.isDrawing = true
    state.lastPoint = { x, y }
    addWallPoint(x, y)
  }

  const handleMouseMove = (e) => {
    const state = simulationStateRef.current
    if (!state.isDrawing) return
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width))
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height))
    
    if (state.lastPoint) {
      drawWallLine(state.lastPoint.x, state.lastPoint.y, x, y)
      state.lastPoint = { x, y }
    }
  }

  const handleMouseUp = () => {
    const state = simulationStateRef.current
    state.isDrawing = false
    state.lastPoint = null
  }

  // Initialize on mount
  useEffect(() => {
    initializeSimulation()
    animationFrameRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Update particle counts
  useEffect(() => {
    const state = simulationStateRef.current
    if (state.microParticles.length !== numMicroParticles) {
      state.microParticles = initializeMicroParticles(state.imgSize, numMicroParticles)
    }
    if (state.filterParticles.length !== numFilterParticles) {
      state.filterParticles = initializeFilterParticles(state.imgSize, numFilterParticles)
    }
  }, [numMicroParticles, numFilterParticles])

  // Update scenario
  useEffect(() => {
    applyScenarioWalls(scenario)
  }, [scenario])

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={600}
      className="w-full h-auto cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  )
})

ParticleFilterSimulation.displayName = 'ParticleFilterSimulation'

export default ParticleFilterSimulation
