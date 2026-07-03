'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'

if (typeof window !== 'undefined') {
  const { RoundedBoxGeometry } = require('three/examples/jsm/geometries/RoundedBoxGeometry.js')
  extend({ RoundedBoxGeometry })
}

// Pure deterministic pseudo-random number generator to comply with React 19 component rules
function pureRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

interface CoffeeCupProps {
  cupRef: React.RefObject<THREE.Group | null>
  onLoad?: () => void
}


export default function CoffeeCup({ cupRef, onLoad }: CoffeeCupProps) {
  const visualGroupRef = useRef<THREE.Group>(null)
  const liquidRef = useRef<THREE.Mesh>(null)
  const iceMeshRef = useRef<THREE.InstancedMesh>(null)
  const dropletsMeshRef = useRef<THREE.InstancedMesh>(null)
  const dropObject = useMemo(() => new THREE.Object3D(), [])
  const iceObject = useMemo(() => new THREE.Object3D(), [])

  // Create ultra-high-res mathematically perfect LatheGeometry profile for a Premium Takeaway Cup
  const cupLatheGeometry = useMemo(() => {
    const points = [];
    const height = 2.8;
    const bottomRadius = 0.81;
    const topRadius = 1.07;
    const thickness = 0.005; // ~1.5mm physical thickness
    const rimRadius = 0.025;

    // Helper function to calculate radius with plastic cup structural ridges
    const getCupRadius = (t: number) => {
      let r = bottomRadius + t * (topRadius - bottomRadius);
      // Add three horizontal structural rings near the top (t from 0 to 1)
      if (t > 0.76 && t < 0.78) r += 0.015;
      if (t > 0.84 && t < 0.86) r += 0.015;
      if (t > 0.92 && t < 0.94) r += 0.015;
      return r;
    };

    // Inner wall (bottom to top)
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const y = -height / 2 + t * height;
      const r = getCupRadius(t) - thickness;
      points.push(new THREE.Vector2(r, y));
    }

    // Rolled rim (top lip)
    const rimCenter = new THREE.Vector2(getCupRadius(1), height / 2);
    for (let i = 0; i <= 16; i++) {
      const angle = (Math.PI / 2) - (i / 16) * Math.PI * 1.5;
      points.push(new THREE.Vector2(rimCenter.x + Math.cos(angle) * rimRadius, rimCenter.y + Math.sin(angle) * rimRadius));
    }

    const bottomRimRadius = 0.03;

    // Outer wall (top to bottom, stopping right before the bottom curve)
    for (let i = 0; i <= 60; i++) {
      const t = 1 - (i / 60);
      const y = (-height / 2 + bottomRimRadius) + t * (height - bottomRimRadius);
      const r = getCupRadius(t);
      points.push(new THREE.Vector2(r, y));
    }

    // Bottom base/lip (under the cup) - perfectly smooth rounded edge
    const bottomRimCenter = new THREE.Vector2(bottomRadius - bottomRimRadius, -height / 2 + bottomRimRadius);
    for (let i = 0; i <= 10; i++) {
      const angle = 0 - (i / 10) * (Math.PI); // Curve from right, to bottom, to inside left
      points.push(new THREE.Vector2(bottomRimCenter.x + Math.cos(angle) * bottomRimRadius, bottomRimCenter.y + Math.sin(angle) * bottomRimRadius));
    }
    
    // Inner gap going up to the elevated base floor (creating the thick transparent bottom border)
    points.push(new THREE.Vector2(bottomRadius - bottomRimRadius * 2, -height / 2 + 0.18));
    
    // The structural floor of the cup (elevated to hold the liquid)
    points.push(new THREE.Vector2(0.15, -height / 2 + 0.18));
    
    // Injection mold pip at bottom center (slightly raised dent to prevent flat cut look)
    points.push(new THREE.Vector2(0.05, -height / 2 + 0.20));
    points.push(new THREE.Vector2(0, -height / 2 + 0.20));

    return new THREE.LatheGeometry(points, 128); // Higher res for perfect rim
  }, []);

  // Create volumetric liquid Lathe profile with physical meniscus
  const liquidLatheGeometry = useMemo(() => {
    const points = [];
    const height = 2.62; // Full cup
    const bottomRadius = 0.82; // Matches inner cup
    const topRadius = 1.05; // Matches inner cup at height

    // Center bottom (Resting safely on the elevated cup floor)
    points.push(new THREE.Vector2(0, -2.8 / 2 + 0.205));
    // Center floor curve
    points.push(new THREE.Vector2(0.15, -2.8 / 2 + 0.185));
    // Bottom edge (sits safely on the elevated floor)
    points.push(new THREE.Vector2(bottomRadius - 0.02, -2.8 / 2 + 0.185));

    // Outer wall up to meniscus (slightly shrunk to prevent z-fighting with cup)
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const y = (-2.8 / 2 + 0.185) + t * height;
      const r = (bottomRadius - 0.02) + t * (topRadius - (bottomRadius - 0.02));
      points.push(new THREE.Vector2(r * 0.985, y)); // Inset by 1.5% to guarantee no Z-fighting
    }

    // Meniscus curve (capillary action)
    const liquidTopY = (-2.8 / 2 + 0.185) + height;
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const y = liquidTopY + (1 - Math.sin(t * Math.PI / 2)) * 0.04; // Curve down slightly from edge
      const r = (topRadius * 0.985) - (1 - Math.cos(t * Math.PI / 2)) * 0.04;
      points.push(new THREE.Vector2(r, y));
    }

    // Surface to center (perfectly flat from the end of meniscus)
    points.push(new THREE.Vector2(0, liquidTopY));

    return new THREE.LatheGeometry(points, 64);
  }, []);

  // Create programmatically generated PBR micro-scratch and fingerprint texture for the plastic cup roughness


  // Create programmatically generated normal map for Ice Cubes (simulating internal cracks and frost)
  const iceNormalTexture = useMemo(() => {
    if (typeof window === 'undefined') return null
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Base normal (flat)
      ctx.fillStyle = '#8080ff'
      ctx.fillRect(0, 0, 512, 512)
      
      let seed = 123
      const rand = () => {
        const x = Math.sin(seed++) * 10000
        return x - Math.floor(x)
      }
      
      // Draw sharp geometric cracks
      for (let i = 0; i < 200; i++) {
        const startX = rand() * 512
        const startY = rand() * 512
        const length = 10 + rand() * 80
        const angle = rand() * Math.PI * 2
        
        ctx.strokeStyle = rand() > 0.5 ? '#ffffff' : '#0000ff' // Perturb normals sharply
        ctx.lineWidth = 1 + rand() * 3
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        
        // Jagged path
        let curX = startX
        let curY = startY
        for (let j = 0; j < 3; j++) {
          curX += Math.cos(angle + (rand() - 0.5)) * (length / 3)
          curY += Math.sin(angle + (rand() - 0.5)) * (length / 3)
          ctx.lineTo(curX, curY)
        }
        ctx.stroke()
      }
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.needsUpdate = true
    return tex
  }, [])

  // Create programmatically generated coffee vertical gradient texture (dark at bottom, lighter at top)
  const liquidGradientTexture = useMemo(() => {
    if (typeof window === 'undefined') return null
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 1024
    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Base Gradient
      const grad = ctx.createLinearGradient(0, 1024, 0, 0)
      grad.addColorStop(0.0, '#2e1509') // Dark coffee base
      grad.addColorStop(0.3, '#4a2511') // Medium roast
      grad.addColorStop(0.6, '#6b361a') // Rich amber
      grad.addColorStop(0.85, '#8f4a24') // Lighter coffee
      grad.addColorStop(1.0, '#a6592f') // Top
      
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 256, 1024)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [])

  // Create programmatically generated crisp CanvasTexture for printed white logo matching the minimalist reference
  const logoTexture = useMemo(() => {
    if (typeof window === 'undefined') return null
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, 1024, 1024)
      
      // Use a very light/thin sans-serif font
      ctx.font = '200 130px system-ui, -apple-system, sans-serif'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
      ctx.textAlign = 'center'
      
      // Draw "Brew"
      ctx.fillText('Brew', 512, 450)
      
      // Measure text to draw exact matching horizontal line
      const textMetrics = ctx.measureText('Brew')
      const lineWidth = Math.max(textMetrics.width, 300)
      
      // Draw thin horizontal separator line
      ctx.fillRect(512 - lineWidth / 2, 500, lineWidth, 4)
      
      // Draw "& Co"
      ctx.fillText('& Co', 512, 630)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [])



  // Generate 25 varied, slightly melted ice cubes packed throughout the cup
  const iceCubes = useMemo(() => {
    const temp = []
    let seed = 777
    const rand = () => pureRandom(seed++)
    
    for (let i = 0; i < 25; i++) {
      const angle = rand() * Math.PI * 2
      const radius = rand() * 0.45 // Keep strictly near the center so cubes don't poke through cup walls
      
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      
      // Pack them heavily near the top (floating) and throughout the cup
      const isTopFloater = rand() > 0.4; // 60% of ice floats near the top
      const yStack = isTopFloater ? (1.1 + rand() * 0.4) : (-1.0 + rand() * 2.1)
      
      // Randomly sized rectangular/cubic shapes
      const sizeX = 0.35 + rand() * 0.2
      const sizeY = 0.35 + rand() * 0.2
      const sizeZ = 0.35 + rand() * 0.2
      
      // Radius of the corners (melting)
      const melt = 0.1 + rand() * 0.08
      
      const rotX = rand() * Math.PI
      const rotY = rand() * Math.PI
      const rotZ = rand() * Math.PI
      
      temp.push({ id: i, pos: [x, yStack, z] as [number, number, number], size: [sizeX, sizeY, sizeZ] as [number, number, number], rot: [rotX, rotY, rotZ] as [number, number, number], melt })
    }
    return temp
  }, [])

  useEffect(() => {
    if (onLoad) {
      let rafId: number
      rafId = requestAnimationFrame(() => {
        rafId = requestAnimationFrame(onLoad)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [onLoad])

  // Generate realistic condensation glued mathematically to the cup's exact outer curve
  const droplets = useMemo(() => {
    const temp = []
    let seed = 3000
    const rand = () => pureRandom(seed++)
    
    // Cup physical dimensions matching LatheGeometry exactly
    const cupHeight = 2.8
    const cupBottomY = -1.4
    const bottomRadius = 0.81
    const topRadius = 1.07

    // Helper to get EXACT cup outer radius at any Y height
    const getRadiusAtY = (y: number) => {
      const t = (y - cupBottomY) / cupHeight
      return bottomRadius + t * (topRadius - bottomRadius)
    }

    // 1. Hundreds of tiny fog/micro condensation droplets (heavy around the upper cold ice half)
    for (let i = 0; i < 400; i++) {
      const angle = rand() * Math.PI * 2
      // Bias more droplets towards the upper half (ice area)
      const y = cupBottomY + 0.3 + (rand() * (cupHeight - 0.4))
      const isUpperHalf = y > 0
      if (!isUpperHalf && rand() > 0.3) continue // 70% less droplets on bottom half
      
      const rAtY = getRadiusAtY(y)
      let size = 0.003 + rand() * 0.006 // Tiny micro-droplets
      
      // Some larger merging drops
      if (rand() > 0.9) size += 0.01
      
      // Glue exact to the plastic outer surface
      const dropRadius = rAtY + size * 0.5
      const x = Math.cos(angle) * dropRadius
      const z = Math.sin(angle) * dropRadius
      
      temp.push({
        id: `drop-${i}`,
        position: [x, y, z] as [number, number, number],
        scale: size
      })
    }
    
    // 2. Elongated running water trails
    for (let t = 0; t < 12; t++) {
      const angle = rand() * Math.PI * 2
      const startY = 1.0 - rand() * 1.5 // Start somewhere upper/middle
      const trailLength = 0.4 + rand() * 0.8
      const steps = 15 + Math.floor(rand() * 10) // Smooth dense trail
      
      for (let s = 0; s < steps; s++) {
        const y = startY - (s / steps) * trailLength
        if (y < cupBottomY) continue
        
        const rAtY = getRadiusAtY(y)
        
        // Slight horizontal wobble to look organic
        const wobble = Math.sin(s * 1.5) * 0.015
        const currentAngle = angle + wobble
        
        // Bottom-most drop in trail is larger and tear-shaped (simulated by scale)
        const isBottom = s === steps - 1
        const size = isBottom ? (0.012 + rand() * 0.008) : (0.004 + rand() * 0.004)
          
        const dropRadius = rAtY + size * 0.5
        const x = Math.cos(currentAngle) * dropRadius
        const z = Math.sin(currentAngle) * dropRadius
          
        temp.push({
          id: `trail-${t}-${s}`,
          position: [x, y, z] as [number, number, number],
          scale: size
        })
      }
    }
    
    return temp
  }, [])



  useEffect(() => {
    const mesh = dropletsMeshRef.current
    if (mesh && droplets.length > 0) {
      mesh.count = droplets.length
      droplets.forEach((drop, index) => {
        dropObject.position.set(...drop.position)
        dropObject.scale.set(drop.scale, drop.scale, drop.scale)
        dropObject.updateMatrix()
        mesh.setMatrixAt(index, dropObject.matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
    }
  }, [droplets, dropObject])

  useEffect(() => {
    const mesh = iceMeshRef.current
    if (mesh && iceCubes.length > 0) {
      mesh.count = iceCubes.length
      iceCubes.forEach((ice, index) => {
        iceObject.position.set(...ice.pos)
        iceObject.rotation.set(...ice.rot)
        iceObject.scale.set(...ice.size)
        iceObject.updateMatrix()
        mesh.setMatrixAt(index, iceObject.matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
    }
  }, [iceCubes, iceObject])

  // Animate the iced coffee continuously; the parent group remains available for scroll transforms.
  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime()

    if (visualGroupRef.current) {
      // Luxury showroom floating (very slow sine wave on Y)
      visualGroupRef.current.position.y = Math.sin(elapsed * 0.4) * 0.08
      
      // Continuous slow idle rotation for the "alive" luxury feel when not scrolling
      visualGroupRef.current.rotation.y = elapsed * 0.35 
      
      // Slight tilt bobbing
      visualGroupRef.current.rotation.z = Math.sin(elapsed * 0.25) * 0.02
    }
    
    if (liquidRef.current) {
      // Removed the scale.x and scale.z animations which were pushing the liquid mesh through the cup,
      // causing severe Z-fighting (the zigzag artifact). The rotation is retained for subtle liquid movement.
      liquidRef.current.rotation.y = Math.sin(elapsed * 0.55) * 0.08
    }

    if (iceMeshRef.current) {
      iceMeshRef.current.position.y = Math.sin(elapsed * 0.9) * 0.03
      iceMeshRef.current.rotation.y = Math.cos(elapsed * 0.4) * 0.04
      iceMeshRef.current.rotation.x = Math.sin(elapsed * 0.5) * 0.015
    }
  })

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const initX = isMobile ? 0 : 0.55
  const initY = isMobile ? 0.95 : 1.05
  const initScale = isMobile ? 0.20 : 0.26

  return (
    <group 
      ref={cupRef} 
      scale={initScale}
      position={[initX, initY, 0.18]}
      rotation={[0.35, -0.25, -0.15]}
    >
      <group ref={visualGroupRef}>

        {/* 1. Ultra-Thin PET Plastic Cup */}
        <mesh renderOrder={7}>
          <primitive object={cupLatheGeometry} />
          <meshPhysicalMaterial
            color="#ffffff" // Crystal clear
            transmission={0.99} // Maximum transmission
            roughness={0.0} // Purely smooth crystal PET
            metalness={0.0}
            ior={1.46} // IOR of PET plastic
            thickness={0.8} // Subsurface light refraction scattering
            clearcoat={1.0} // Shiny outer shell
            clearcoatRoughness={0.0} // Crystal clear reflection
            transparent
            opacity={1.0}
            depthWrite={true}
            side={THREE.FrontSide}
          />
        </mesh>


        {/* Curved front label mesh displaying printed white logo */}
        {logoTexture && (
          <mesh position={[0, -0.1, 0.015]} renderOrder={6}>
            <cylinderGeometry args={[1.108, 0.828, 2.73, 64, 1, true, -Math.PI / 3, Math.PI * 2 / 3]} />
            <meshBasicMaterial
              map={logoTexture}
              transparent
              alphaTest={0.05}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* 2. Volumetric Latte Liquid with Physical Diffusion (Lathe Geometry) */}
        <mesh ref={liquidRef}>
          <primitive object={liquidLatheGeometry} />
          <meshStandardMaterial
            map={liquidGradientTexture || undefined}
            color="#ffffff" 
            roughness={0.05} 
            metalness={0.1}
          />
        </mesh>






        {/* 4. High-Fidelity Refractive Instanced Ice Cubes */}
        <instancedMesh ref={iceMeshRef} args={[null as any, null as any, iceCubes.length]} renderOrder={4}>
          {/* @ts-ignore */}
          <roundedBoxGeometry args={[1, 1, 1, 6, 0.12]} />
          <meshPhysicalMaterial
            color="#f7fbff" // Crisp frost white
            transmission={0.99} // High transmission for deep refraction
            thickness={0.8} // Subsurface scattering thickness
            ior={1.31} // IOR of ice
            roughness={0.02} // Highly glossy wet ice
            normalMap={iceNormalTexture || undefined}
            normalScale={new THREE.Vector2(0.4, 0.4)} // Subtle cracks
            transparent
            opacity={1.0}
            clearcoat={1.0}
            clearcoatRoughness={0.02} // Wet exterior
            attenuationColor="#ffffff"
            attenuationDistance={1.0}
            depthWrite={true}
          />
        </instancedMesh>

        {/* 5. Straw - Premium Matte Black Plastic */}
        <group position={[0.08, 0.5, -0.05]} rotation={[-0.15, 0, 0.18]}>
          <mesh position={[0, 0, 0]} renderOrder={5}>
            <cylinderGeometry args={[0.045, 0.045, 3.8, 32]} />
            <meshPhysicalMaterial
              color="#0f0f0f" // Premium Matte Black
              roughness={0.6} // Diffuse matte surface
              metalness={0.05}
              clearcoat={0.3} // Subtle premium sheen
              clearcoatRoughness={0.4}
            />
          </mesh>
        </group>

        {/* 6. Condensation Droplets & Running Water Trails */}
        <instancedMesh ref={dropletsMeshRef} args={[null as any, null as any, droplets.length]} renderOrder={8}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshPhysicalMaterial
            color="#ffffff"
            transmission={0.96}
            roughness={0.01}
            thickness={0.08}
            transparent
            opacity={0.85}
            clearcoat={1.0}
            clearcoatRoughness={0.02}
            depthWrite={false}
          />
        </instancedMesh>
      </group>
    </group>
  )
}


