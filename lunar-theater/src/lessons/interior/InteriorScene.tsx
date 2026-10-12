import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html, Stars, useTexture } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import { DoubleSide, Plane, Vector3, type PerspectiveCamera as Cam } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { EARTH_RADIUS } from '../../lib/scale'
import { layerIndex } from './beats'
import { useTheater } from '../../theater/context'
import type { LessonSceneProps } from '../types'
import type { CameraPreset } from '../../theater/types'

const look = new Vector3()
const desired = new Vector3()

const OVERVIEW = new Vector3(2.6, 1.7, -5.4)
const SIDE = new Vector3(5.8, 0.35, -1.2)
const CORE = new Vector3(1.15, 0.55, -1.85)

const LAYER_RADII = [1, 0.89, 0.55, 0.22]
const LAYER_COLORS = ['#6a4a3a', '#9a5340', '#d4683a', '#F4C989']
const LAYER_NAMES = ['地壳', '地幔', '外核', '内核']

function goalOf(preset: CameraPreset) {
  if (preset === 'side') return SIDE
  if (preset === 'earth') return CORE
  return OVERVIEW
}

function SpaceRig() {
  const { cameraPreset, mode } = useTheater()
  const controls = useRef<OrbitControlsImpl>(null)
  const { camera } = useThree()
  const arriving = useRef(true)
  const lastPreset = useRef(cameraPreset)

  useFrame((_, dt) => {
    const demo = mode === 'demo'
    const k = 1 - Math.exp(-dt * 2.2)
    if (lastPreset.current !== cameraPreset) {
      lastPreset.current = cameraPreset
      arriving.current = true
    }
    desired.copy(goalOf(cameraPreset))
    look.set(0, 0, 0)
    const cam = camera as Cam
    cam.fov += ((cameraPreset === 'earth' ? 42 : 40) - cam.fov) * k
    cam.updateProjectionMatrix()
    if (demo || arriving.current) {
      if (controls.current) controls.current.enabled = false
      camera.position.lerp(desired, k)
      camera.lookAt(look)
      if (controls.current) controls.current.target.copy(look)
      if (!demo && camera.position.distanceTo(desired) < 0.08) arriving.current = false
    } else if (controls.current) {
      controls.current.enabled = true
    }
  })

  return (
    <>
      <PerspectiveCamera makeDefault fov={40} near={0.05} far={80} position={[2.6, 1.7, -5.4]} />
      <OrbitControls ref={controls} enableDamping dampingFactor={0.08} minDistance={1.6} maxDistance={14} enablePan={false} />
    </>
  )
}

function CutawayEarth() {
  const { t, extra, showLabels } = useTheater()
  const albedo = useTexture(`${import.meta.env.BASE_URL}textures/earth.jpg`)
  const planes = useMemo(() => [new Plane(new Vector3(0, 0, 1), 0)], [])
  const active = layerIndex(t)
  const clip = extra ? planes : []

  return (
    <group rotation={[0, 0.35, 0]}>
      {LAYER_RADII.map((r, i) => {
        const isCrust = i === 0
        const on = extra && active === i
        return (
          <mesh key={LAYER_NAMES[i]} renderOrder={i}>
            <sphereGeometry args={[EARTH_RADIUS * r, isCrust ? 64 : 48, isCrust ? 64 : 48]} />
            {isCrust ? (
              <meshStandardMaterial
                map={albedo}
                roughness={0.55}
                metalness={0.05}
                clippingPlanes={clip}
                clipShadows
                side={DoubleSide}
                emissive="#e8c48a"
                emissiveIntensity={on ? 0.2 : 0}
              />
            ) : (
              <meshStandardMaterial
                color={LAYER_COLORS[i]}
                emissive={LAYER_COLORS[i]}
                emissiveIntensity={on ? 0.32 : 0.05}
                roughness={0.42}
                metalness={i >= 2 ? 0.35 : 0.08}
                clippingPlanes={clip}
                clipShadows
                side={DoubleSide}
              />
            )}
          </mesh>
        )
      })}
      {extra &&
        showLabels &&
        LAYER_RADII.map((r, i) => (
          <Html
            key={`l-${LAYER_NAMES[i]}`}
            position={[r * 0.62, (i - 1.5) * 0.16, 0.05]}
            center
            style={{ pointerEvents: 'none' }}
          >
            <span className={i === 3 ? 'orbit-mark sun-mark' : 'orbit-mark'}>
              {LAYER_NAMES[i]}
            </span>
          </Html>
        ))}
    </group>
  )
}

function InteriorStage() {
  const { extra } = useTheater()
  return (
    <>
      <color attach="background" args={['#0B1018']} />
      <fog attach="fog" args={['#0B1018', 12, 28]} />
      <Stars radius={80} depth={40} count={1600} factor={2.4} saturation={0} fade speed={0} />
      <ambientLight intensity={0.18} />
      <hemisphereLight args={['#7EA8C8', '#1a1010', 0.35]} />
      <directionalLight position={[6, 4, 8]} intensity={2.1} color="#fff4e0" />
      <directionalLight position={[-4, -2, -2]} intensity={0.35} color="#7EA8C8" />
      <CutawayEarth />
      {!extra && (
        <Html position={[0, 1.25, 0]} center style={{ pointerEvents: 'none' }}>
          <span className="orbit-mark">地球</span>
        </Html>
      )}
    </>
  )
}

export function InteriorScene({ variant }: LessonSceneProps) {
  if (variant === 'earth') return null
  return (
    <>
      <SpaceRig />
      <InteriorStage />
    </>
  )
}
