import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useRef } from 'react'
import { Vector3, type PerspectiveCamera as Cam } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Stage } from '../../stage/Stage'
import { moonPosition } from '../../lib/moonOrbit'
import { EARTH_RADIUS, ORBIT_INCLINATION_DEG } from '../../lib/scale'
import { isNearNew } from '../../lib/moonOrbit'
import { useTheater } from '../../theater/context'
import type { LessonSceneProps } from '../types'
import type { CameraPreset } from '../../theater/types'

const pos = new Vector3()
const look = new Vector3()
const desired = new Vector3()
const dir = new Vector3()

const OVERVIEW = new Vector3(22, 14, 28)
const SIDE = new Vector3(2.2, 8, 32)

function goalOf(preset: CameraPreset) {
  return preset === 'side' ? SIDE : OVERVIEW
}

function SpaceRig() {
  const { tRef, extra, cameraPreset, mode } = useTheater()
  const controls = useRef<OrbitControlsImpl>(null)
  const { camera } = useThree()
  const arriving = useRef(true)
  const lastPreset = useRef(cameraPreset)
  const incl = extra ? 0 : ORBIT_INCLINATION_DEG

  useFrame((_, dt) => {
    moonPosition(tRef.current, pos, incl)
    const demo = mode === 'demo'
    const k = 1 - Math.exp(-dt * (demo ? 1.7 : 2.6))

    if (lastPreset.current !== cameraPreset) {
      lastPreset.current = cameraPreset
      arriving.current = true
    }

    if (cameraPreset === 'earth') {
      if (controls.current) controls.current.enabled = false
      if (isNearNew(tRef.current)) {
        camera.position.lerp(desired.set(EARTH_RADIUS * 1.2, 0.15, 0.4), k)
        camera.lookAt(80, 0, 0)
        if (controls.current) controls.current.target.set(80, 0, 0)
      } else {
        dir.copy(pos).normalize()
        desired.copy(dir).multiplyScalar(EARTH_RADIUS * 1.5)
        camera.position.lerp(desired, k)
        camera.lookAt(pos)
        if (controls.current) controls.current.target.copy(pos)
      }
      const cam = camera as Cam
      cam.fov += ((isNearNew(tRef.current) ? 8 : 34) - cam.fov) * k
      cam.updateProjectionMatrix()
      return
    }

    desired.copy(goalOf(cameraPreset))
    const cam = camera as Cam
    cam.fov += ((cameraPreset === 'side' ? 36 : 40) - cam.fov) * k
    cam.updateProjectionMatrix()
    look.set(pos.x * 0.18, 0, pos.z * 0.18)

    if (demo || arriving.current) {
      if (controls.current) controls.current.enabled = false
      camera.position.lerp(desired, k)
      camera.lookAt(look)
      if (controls.current) controls.current.target.copy(look)
      if (!demo && camera.position.distanceTo(desired) < 0.15) arriving.current = false
    } else if (controls.current) {
      controls.current.enabled = true
    }
  })

  return (
    <>
      <PerspectiveCamera makeDefault fov={40} near={0.1} far={400} position={[22, 14, 28]} />
      <OrbitControls ref={controls} enableDamping dampingFactor={0.08} minDistance={6} maxDistance={80} enablePan={false} />
    </>
  )
}

function EclipseEarthRig() {
  const { tRef, extra } = useTheater()
  const { camera } = useThree()
  const incl = extra ? 0 : ORBIT_INCLINATION_DEG

  useFrame(() => {
    moonPosition(tRef.current, pos, incl)
    if (isNearNew(tRef.current)) {
      camera.position.set(EARTH_RADIUS * 1.08, 0.02, 0)
      camera.up.set(0, 1, 0)
      camera.lookAt(90, 0, 0)
      const cam = camera as Cam
      cam.fov = extra ? 3.6 : 5.2
      cam.updateProjectionMatrix()
      return
    }
    dir.copy(pos).normalize()
    camera.position.copy(dir).multiplyScalar(EARTH_RADIUS * 1.12)
    camera.up.set(0, 1, 0)
    if (Math.abs(dir.y) > 0.85) camera.up.set(0, 0, 1)
    camera.lookAt(pos)
    const cam = camera as Cam
    cam.fov = 5.4
    cam.updateProjectionMatrix()
  })

  return <PerspectiveCamera makeDefault fov={5.4} near={0.02} far={120} />
}

export function EclipseScene({ variant }: LessonSceneProps) {
  const { extra } = useTheater()
  const incl = extra ? 0 : ORBIT_INCLINATION_DEG
  return (
    <>
      {variant === 'space' ? <SpaceRig /> : <EclipseEarthRig />}
      <Stage variant={variant} inclinationDeg={incl} forceUmbra />
    </>
  )
}
