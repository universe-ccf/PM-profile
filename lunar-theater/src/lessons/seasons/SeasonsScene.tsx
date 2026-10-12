import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html, Line, Stars } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import { Vector3, type Group, type PerspectiveCamera as Cam } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Earth } from '../../stage/Earth'
import { Lighting, Sun } from '../../stage/Sun'
import { earthOrbitPosition, northPoleDir } from '../../lib/seasons'
import { AXIAL_TILT_DEG, EARTH_ORBIT } from '../../lib/scale'
import { useTheater } from '../../theater/context'
import type { LessonSceneProps } from '../types'

const earthPos = new Vector3()
const pole = new Vector3()
const look = new Vector3()
const desired = new Vector3()

const OVERVIEW = new Vector3(4, 16, 22)
const SIDE = new Vector3(0.2, 3, 26)

function tiltRad(untilt: boolean) {
  return untilt ? 0 : (AXIAL_TILT_DEG * Math.PI) / 180
}

function orbitCircle() {
  const pts: Vector3[] = []
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2
    pts.push(new Vector3(EARTH_ORBIT * Math.cos(a), 0, EARTH_ORBIT * Math.sin(a)))
  }
  return pts
}

const MARKS = [
  { t: 0, label: '冬' },
  { t: 0.25, label: '春' },
  { t: 0.5, label: '夏' },
  { t: 0.75, label: '秋' },
] as const

function SpaceRig() {
  const { tRef, extra, cameraPreset, mode } = useTheater()
  const controls = useRef<OrbitControlsImpl>(null)
  const { camera } = useThree()
  const arriving = useRef(true)
  const lastPreset = useRef(cameraPreset)

  useFrame((_, dt) => {
    earthOrbitPosition(tRef.current, earthPos)
    northPoleDir(extra ? 0 : AXIAL_TILT_DEG, pole)
    const demo = mode === 'demo'
    const k = 1 - Math.exp(-dt * (demo ? 1.6 : 2.4))

    if (lastPreset.current !== cameraPreset) {
      lastPreset.current = cameraPreset
      arriving.current = true
    }

    if (cameraPreset === 'earth') {
      if (controls.current) controls.current.enabled = false
      desired.copy(earthPos).addScaledVector(pole, 3.6)
      camera.position.lerp(desired, k)
      camera.lookAt(earthPos)
      if (controls.current) controls.current.target.copy(earthPos)
      const cam = camera as Cam
      cam.fov += (42 - cam.fov) * k
      cam.updateProjectionMatrix()
      return
    }

    desired.copy(cameraPreset === 'side' ? SIDE : OVERVIEW)
    const cam = camera as Cam
    cam.fov += ((cameraPreset === 'side' ? 38 : 42) - cam.fov) * k
    cam.updateProjectionMatrix()
    look.copy(earthPos).multiplyScalar(0.15)

    if (demo || arriving.current) {
      if (controls.current) controls.current.enabled = false
      camera.position.lerp(desired, k)
      camera.lookAt(look)
      if (controls.current) controls.current.target.copy(look)
      if (!demo && camera.position.distanceTo(desired) < 0.2) arriving.current = false
    } else if (controls.current) {
      controls.current.enabled = true
    }
  })

  return (
    <>
      <PerspectiveCamera makeDefault fov={42} near={0.1} far={400} position={[4, 16, 22]} />
      <OrbitControls ref={controls} enableDamping dampingFactor={0.08} minDistance={8} maxDistance={70} enablePan={false} />
    </>
  )
}

function PoleRig() {
  const { tRef, extra } = useTheater()
  const { camera } = useThree()

  useFrame(() => {
    earthOrbitPosition(tRef.current, earthPos)
    northPoleDir(extra ? 0 : AXIAL_TILT_DEG, pole)
    camera.position.copy(earthPos).addScaledVector(pole, 3.2)
    camera.up.set(0, 0, 1)
    camera.lookAt(earthPos)
  })

  return <PerspectiveCamera makeDefault fov={40} near={0.05} far={80} />
}

function SeasonStage({ showDecor }: { showDecor: boolean }) {
  const { tRef, extra, showLabels } = useTheater()
  const earthRef = useRef<Group>(null)
  const circle = useMemo(() => orbitCircle(), [])
  const marks = useMemo(
    () => MARKS.map((m) => ({ ...m, p: earthOrbitPosition(m.t) })),
    [],
  )

  useFrame(() => {
    const g = earthRef.current
    if (!g) return
    earthOrbitPosition(tRef.current, g.position)
    g.rotation.z = tiltRad(extra)
  })

  return (
    <>
      <color attach="background" args={['#0B1018']} />
      <fog attach="fog" args={['#0B1018', 40, 90]} />
      <Stars radius={160} depth={60} count={showDecor ? 2400 : 900} factor={3} saturation={0} fade speed={0} />
      <Lighting mode="point" />
      <Sun position={[0, 0, 0]} size={2.15} />
      {showDecor && showLabels && (
        <Html position={[0, 2.6, 0]} center style={{ pointerEvents: 'none' }}>
          <span className="orbit-mark sun-mark">太阳</span>
        </Html>
      )}
      {showDecor && <Line points={circle} color="#7EA8C8" transparent opacity={0.35} />}
      {showDecor &&
        showLabels &&
        marks.map((m) => (
          <Html
            key={m.label}
            position={[m.p.x * 1.08, 0.4, m.p.z * 1.08]}
            center
            style={{ pointerEvents: 'none' }}
          >
            <span className="orbit-mark">{m.label}</span>
          </Html>
        ))}
      <group ref={earthRef}>
        <mesh>
          <cylinderGeometry args={[0.025, 0.025, 2.85, 8]} />
          <meshBasicMaterial color="#F4C989" />
        </mesh>
        {showDecor && showLabels && (
          <>
            <Html position={[0, 1.55, 0]} center style={{ pointerEvents: 'none' }}>
              <span className="orbit-mark sun-mark">北</span>
            </Html>
            <Html position={[0, -1.55, 0]} center style={{ pointerEvents: 'none' }}>
              <span className="orbit-mark">南</span>
            </Html>
          </>
        )}
        <Earth spin={0.35} />
      </group>
    </>
  )
}

export function SeasonsScene({ variant }: LessonSceneProps) {
  return (
    <>
      {variant === 'space' ? <SpaceRig /> : <PoleRig />}
      <SeasonStage showDecor={variant === 'space'} />
    </>
  )
}
