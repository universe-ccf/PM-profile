import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useRef } from 'react'
import { Vector3, type PerspectiveCamera as Cam } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Stage } from '../../stage/Stage'
import { moonPosition } from '../../lib/moonOrbit'
import { EARTH_RADIUS } from '../../lib/scale'
import { useTheater } from '../../theater/context'
import type { LessonSceneProps } from '../types'
import type { CameraPreset } from '../../theater/types'

const moon = new Vector3()
const look = new Vector3()
const desired = new Vector3()
const dir = new Vector3()

const OVERVIEW_POS = new Vector3(1.8, 9.2, 32)
const OVERVIEW_LOOK = new Vector3(2.4, 0.12, 0)
const OVERVIEW_FOV = 46
const SIDE_FOV = 26
const FROM_EARTH_FOV = 7.4

function aim(preset: CameraPreset, moonPos: Vector3, out: Vector3, at: Vector3) {
  if (preset === 'earth') {
    dir.copy(moonPos).normalize()
    out.copy(dir).multiplyScalar(EARTH_RADIUS * 1.13)
    at.copy(moonPos)
    return FROM_EARTH_FOV
  }

  if (preset === 'side') {
    at.copy(moonPos)
    out.copy(moonPos)
    out.x += 0.35
    out.y += 0.95
    out.z += 3.9
    return SIDE_FOV
  }

  out.copy(OVERVIEW_POS)
  at.copy(OVERVIEW_LOOK)
  return OVERVIEW_FOV
}

function SpaceRig() {
  const { tRef, cameraPreset, mode, playing, setCameraPreset } = useTheater()
  const controls = useRef<OrbitControlsImpl>(null)
  const { camera } = useThree()
  const arriving = useRef(true)
  const lastPreset = useRef(cameraPreset)
  const userControl = useRef(false)

  useFrame((_, dt) => {
    moonPosition(tRef.current, moon)
    const fovTarget = aim(cameraPreset, moon, desired, look)
    const cam = camera as Cam
    const k = 1 - Math.exp(-dt * 2.2)

    if (lastPreset.current !== cameraPreset) {
      lastPreset.current = cameraPreset
      arriving.current = true
      userControl.current = false
    }

    if (cameraPreset === 'earth') {
      if (controls.current) controls.current.enabled = false
      camera.position.copy(desired)
      camera.up.set(0, 1, 0)
      if (Math.abs(dir.y) > 0.85) camera.up.set(0, 0, 1)
      camera.lookAt(look)
      cam.fov += (fovTarget - cam.fov) * k
      cam.updateProjectionMatrix()
      if (controls.current) controls.current.target.copy(look)
      return
    }

    const scripted = mode === 'demo' && playing && !userControl.current
    const lock = scripted || arriving.current

    if (lock) {
      camera.position.lerp(desired, k)
      camera.lookAt(look)
      cam.fov += (fovTarget - cam.fov) * k
      cam.updateProjectionMatrix()
      if (controls.current) {
        controls.current.target.copy(look)
        controls.current.enabled = true
      }
      if (!scripted && camera.position.distanceTo(desired) < 0.16) arriving.current = false
    } else if (controls.current) {
      controls.current.enabled = true
    }
  })

  return (
    <>
      <PerspectiveCamera makeDefault fov={OVERVIEW_FOV} near={0.08} far={2500} position={[1.8, 9.2, 32]} />
      <OrbitControls
        ref={controls}
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={90}
        enablePan={false}
        onStart={() => {
          if (cameraPreset === 'earth') return
          userControl.current = true
          arriving.current = false
          if (mode === 'demo') setCameraPreset(cameraPreset)
        }}
      />
    </>
  )
}

function EarthRig() {
  const { tRef } = useTheater()
  const { camera } = useThree()

  useFrame(() => {
    moonPosition(tRef.current, moon)
    dir.copy(moon).normalize()
    camera.position.copy(dir).multiplyScalar(EARTH_RADIUS * 1.12)
    camera.up.set(0, 1, 0)
    if (Math.abs(dir.y) > 0.85) camera.up.set(0, 0, 1)
    camera.lookAt(moon)
  })

  return <PerspectiveCamera makeDefault fov={6.2} near={0.02} far={140} />
}

export function MoonPhaseScene({ variant }: LessonSceneProps) {
  return (
    <>
      {variant === 'space' ? <SpaceRig /> : <EarthRig />}
      <Stage variant={variant} />
    </>
  )
}
