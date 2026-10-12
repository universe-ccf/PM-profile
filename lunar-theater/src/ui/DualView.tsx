import { Canvas } from '@react-three/fiber'
import { Preload, useProgress } from '@react-three/drei'
import { Suspense } from 'react'
import { useTheater } from '../theater/TheaterContext'
import * as THREE from 'three'

function Boot() {
  const { active, progress } = useProgress()
  if (!active) return null
  return (
    <div className="boot" role="status">
      载入星图 {Math.round(progress)}
    </div>
  )
}

const gl = {
  antialias: true,
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 1.05,
  alpha: false,
  preserveDrawingBuffer: true,
} as const

export function DualView() {
  const { t, extra, lesson } = useTheater()
  const Scene = lesson.Scene
  const caption = lesson.insetCaption(t, extra)

  return (
    <div className="theater">
      <Canvas
        key={lesson.id}
        className="space-canvas"
        dpr={[1, 2]}
        gl={gl}
        camera={{
          position: lesson.spaceCamera.position,
          fov: lesson.spaceCamera.fov,
          near: 0.1,
          far: 2500,
        }}
        onCreated={({ gl: renderer }) => {
          renderer.localClippingEnabled = true
          renderer.shadowMap.enabled = true
          renderer.shadowMap.type = THREE.PCFSoftShadowMap
          renderer.toneMappingExposure = lesson.id === 'moon-phases' ? 1.18 : 1.05
        }}
      >
        <Suspense fallback={null}>
          <Scene variant="space" />
          <Preload all />
        </Suspense>
      </Canvas>

      {lesson.insetKicker && (
        <div className="earth-window">
          <p className="earth-window-kicker">{lesson.insetKicker}</p>
          <div className="view-earth">
            <Canvas
              key={`${lesson.id}-inset`}
              dpr={[1, 1.5]}
              gl={gl}
              camera={{ fov: 5.4, near: 0.02, far: 140 }}
              onCreated={({ gl: renderer }) => {
                renderer.localClippingEnabled = true
                renderer.shadowMap.enabled = true
                renderer.shadowMap.type = THREE.PCFSoftShadowMap
              }}
            >
              <Suspense fallback={null}>
                <Scene variant="earth" />
              </Suspense>
            </Canvas>
          </div>
          <p className="earth-window-phase">
            {caption.name}
            <span>{caption.short}</span>
          </p>
        </div>
      )}
      <Boot />
    </div>
  )
}
