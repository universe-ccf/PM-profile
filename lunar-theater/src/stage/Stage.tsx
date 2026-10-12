import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { Earth } from './Earth'
import { Moon } from './Moon'
import { Lighting, Sun, SunRays } from './Sun'
import { Umbra } from './Umbra'
import { OrbitPath } from './OrbitPath'
import { Starfield } from './Starfield'
import { SpaceFX } from './SpaceFX'
import { moonPosition, moonQuaternion } from '../lib/moonOrbit'
import { ORBIT_INCLINATION_DEG, SUN_DISTANCE, SUN_RADIUS } from '../lib/scale'
import { useTheater } from '../theater/context'

type StageProps = {
  variant?: 'space' | 'earth'
  inclinationDeg?: number
  forceUmbra?: boolean
}

export function Stage({
  variant = 'space',
  inclinationDeg = ORBIT_INCLINATION_DEG,
  forceUmbra = false,
}: StageProps) {
  const { tRef, extra, showLabels } = useTheater()
  const moonRef = useRef<Group>(null)
  const space = variant === 'space'
  const labels = space && showLabels
  const umbra = forceUmbra || extra

  useFrame(() => {
    const g = moonRef.current
    if (!g) return
    moonPosition(tRef.current, g.position, inclinationDeg)
    moonQuaternion(g.position, g.quaternion)
  })

  return (
    <>
      <color attach="background" args={['#02040a']} />
      <Starfield dense={space} near={!space} />
      <Lighting />
      {space && <Sun />}
      {space && <SunRays />}
      {space && <SpaceFX />}
      {space && labels && (
        <Html position={[SUN_DISTANCE, SUN_RADIUS + 1.15, 0]} center style={{ pointerEvents: 'none' }}>
          <span className="orbit-mark sun-mark">太阳</span>
        </Html>
      )}
      {space && <Earth />}
      {labels && (
        <Html position={[0, 1.42, 0]} center style={{ pointerEvents: 'none' }}>
          <span className="orbit-mark">地球</span>
        </Html>
      )}
      <group ref={moonRef}>
        <Moon />
        {labels && (
          <Html position={[0, 0.48, 0]} center style={{ pointerEvents: 'none' }}>
            <span className="orbit-mark">月</span>
          </Html>
        )}
      </group>
      {space && <OrbitPath showLabels={labels} inclinationDeg={inclinationDeg} />}
      {space && umbra && (
        <>
          <Umbra />
          {labels && (
            <Html position={[-9.2, 1.55, 0]} center style={{ pointerEvents: 'none' }}>
              <span className="orbit-mark umbra-mark">地球影子</span>
            </Html>
          )}
        </>
      )}
    </>
  )
}
