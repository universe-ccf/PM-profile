import { SRGBColorSpace } from 'three'
import { useTexture } from '@react-three/drei'
import { useLayoutEffect } from 'react'
import { MOON_RADIUS } from '../lib/scale'

export function Moon() {
  const map = useTexture(`${import.meta.env.BASE_URL}textures/moon.jpg`)
  useLayoutEffect(() => {
    map.colorSpace = SRGBColorSpace
    map.anisotropy = 16
  }, [map])

  return (
    <mesh castShadow receiveShadow>
      <sphereGeometry args={[MOON_RADIUS, 96, 96]} />
      <meshStandardMaterial
        map={map}
        bumpMap={map}
        bumpScale={0.028}
        roughness={0.86}
        metalness={0}
        color="#f3ebe1"
        emissive="#2a2620"
        emissiveIntensity={0.16}
        fog={false}
      />
    </mesh>
  )
}
