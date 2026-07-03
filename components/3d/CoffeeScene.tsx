'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Sparkles, Center, Environment } from '@react-three/drei'
import CoffeeCup from './CoffeeCup'
import { RefObject, Suspense, useMemo, useRef, memo } from 'react'
import * as THREE from 'three'

interface CoffeeSceneProps {
  cupRef: RefObject<THREE.Group | null>
  onLoad?: () => void
}

function FloatingDecorations() {
  const beansRef = useRef<THREE.InstancedMesh>(null)
  const dustRef = useRef<THREE.InstancedMesh>(null)
  const caramelRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Generate particle locations
  const particles = useMemo(() => {
    let seed = 1234
    const rand = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    }
    
    const generateOrbiters = (count: number, minRadius: number, maxRadius: number, scaleBase: number, scaleVar: number) => {
      return Array.from({ length: count }).map(() => ({
        angle: rand() * Math.PI * 2,
        radius: minRadius + rand() * (maxRadius - minRadius),
        y: -1.5 + rand() * 3.5,
        speed: 0.1 + rand() * 0.3,
        scale: scaleBase + rand() * scaleVar,
        rotSpeed: [rand() * 2, rand() * 2, rand() * 2],
        initialRot: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI]
      }))
    }

    return {
      beans: generateOrbiters(15, 1.0, 1.8, 0.025, 0.015), // Reduced count
      dust: generateOrbiters(25, 1.3, 2.8, 0.01, 0.015), // Reduced count
      caramel: generateOrbiters(10, 1.4, 2.6, 0.03, 0.02), // Reduced count
    }
  }, [])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    const updateMesh = (mesh: THREE.InstancedMesh | null, data: any[], isBean: boolean = false) => {
      if (!mesh) return
      data.forEach((p, i) => {
        const curAngle = p.angle + time * p.speed * 0.5
        const x = Math.cos(curAngle) * p.radius
        const z = Math.sin(curAngle) * p.radius
        const y = p.y + Math.sin(time * p.speed + i) * 0.2 // Gentle floating bob

        dummy.position.set(x, y, z)
        dummy.rotation.set(
          p.initialRot[0] + time * p.rotSpeed[0] * 0.3,
          p.initialRot[1] + time * p.rotSpeed[1] * 0.3,
          p.initialRot[2] + time * p.rotSpeed[2] * 0.3
        )
        if (isBean) {
          // Squash the sphere into an oval coffee bean shape
          dummy.scale.set(p.scale, p.scale * 0.7, p.scale * 1.3)
        } else {
          dummy.scale.setScalar(p.scale)
        }
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
    }

    updateMesh(beansRef.current, particles.beans, true)
    updateMesh(dustRef.current, particles.dust)
    updateMesh(caramelRef.current, particles.caramel)
  })

  return (
    <group>
      {/* Roasted Coffee Beans */}
      <instancedMesh ref={beansRef} args={[null as any, null as any, particles.beans.length]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color="#1a0b05" roughness={0.6} metalness={0.1} />
      </instancedMesh>
      
      {/* Tiny Coffee Dust / Powder Specks */}
      <instancedMesh ref={dustRef} args={[null as any, null as any, particles.dust.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#38180b" roughness={0.9} />
      </instancedMesh>
      
      {/* Small Caramel Droplets */}
      <instancedMesh ref={caramelRef} args={[null as any, null as any, particles.caramel.length]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color="#d48b3b" transparent opacity={0.7} roughness={0.15} metalness={0.1} />
      </instancedMesh>
      
      {/* Glowing Sparks & Bokeh */}
      <Sparkles count={50} scale={7} size={2.5} speed={0.2} color="#fcd7a4" opacity={0.4} />
      <Sparkles count={30} scale={6} size={6} speed={0.1} color="#ffffff" opacity={0.1} />
      
      {/* Subtle Smoke / Cold Steam Wisps */}
      <Sparkles count={40} scale={5} size={15} speed={0.05} color="#e6f2ff" opacity={0.03} />
    </group>
  )
}

const CoffeeScene = memo(function CoffeeScene({ cupRef, onLoad }: CoffeeSceneProps) {
  return (
    <div className="coffee-scene-container">
      <Canvas
        dpr={[1, 1.2]} // Capped maximum DPR for performance on high-DPI screens
        performance={{ min: 0.6 }}
        camera={{ position: [0, -0.2, 5.0], fov: 45 }} // 35mm equivalent style
        gl={{
          antialias: true, // Native MSAA restores crispness without lag
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2, // Slightly increased for brighter commercial look
          outputColorSpace: THREE.SRGBColorSpace
        }}
      >
        <Suspense fallback={null}>
          {/* HDRI Studio Environment for realistic material reflections */}
          <Environment preset="studio" blur={0.6} />

          {/* Cinematic 3-Point Studio Lighting setup */}
          
          {/* 1. Warm Key Light (Main Illumination) */}
          <directionalLight
            position={[5, 4, 3]}
            intensity={2.2}
            color="#fff4eb" // Warm sunlight/tungsten
          />
          
          {/* 2. Cool Rim Light (Separates object from background) */}
          <directionalLight
            position={[-5, 2, -4]}
            intensity={1.5}
            color="#d1e8ff" // Cool icy blue
          />
          
          {/* 3. Top Fill Light (Fills shadows and creates rim highlights on ice/lid) */}
          <spotLight
            position={[0, 6, 0]}
            intensity={1.0}
            angle={0.6}
            penumbra={0.8}
            color="#ffffff"
          />

          {/* Procedural 3D model */}
          <group position={[0, -0.2, 0]}>
            <CoffeeCup cupRef={cupRef} onLoad={onLoad} />
          </group>

          {/* Luxury Cinematic Orbiters */}
          <FloatingDecorations />

        </Suspense>
      </Canvas>
    </div>
  )
})

export default CoffeeScene
