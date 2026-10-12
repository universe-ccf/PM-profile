import { AdditiveBlending, DoubleSide } from 'three'
import { EARTH_RADIUS, MOON_DISTANCE } from '../lib/scale'

const LENGTH = MOON_DISTANCE * 1.28

export function Umbra() {
  const mid = -(EARTH_RADIUS + LENGTH / 2)
  return (
    <group>
      <mesh position={[mid, 0, 0]} rotation={[0, 0, Math.PI / 2]} renderOrder={2}>
        <cylinderGeometry args={[0.42, EARTH_RADIUS * 0.96, LENGTH, 48, 1, true]} />
        <meshBasicMaterial
          color="#0a101c"
          transparent
          opacity={0.55}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[mid, 0, 0]} rotation={[0, 0, Math.PI / 2]} renderOrder={2}>
        <cylinderGeometry args={[0.72, EARTH_RADIUS * 1.18, LENGTH, 48, 1, true]} />
        <meshBasicMaterial
          color="#1a2438"
          transparent
          opacity={0.22}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[mid, 0, 0]} rotation={[0, 0, Math.PI / 2]} renderOrder={2}>
        <cylinderGeometry args={[0.95, EARTH_RADIUS * 1.38, LENGTH, 32, 1, true]} />
        <meshBasicMaterial
          color="#3d4a66"
          transparent
          opacity={0.07}
          side={DoubleSide}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  )
}
