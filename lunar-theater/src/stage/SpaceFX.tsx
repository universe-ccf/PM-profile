import { Effects } from '@react-three/drei'
import { extend, useThree } from '@react-three/fiber'
import { Vector2 } from 'three'
import { UnrealBloomPass } from 'three-stdlib'

const BloomPass = extend(UnrealBloomPass)

export function SpaceFX() {
  const size = useThree((s) => s.size)
  return (
    <Effects disableGamma>
      <BloomPass args={[new Vector2(size.width, size.height), 0.7, 0.52, 0.84]} />
    </Effects>
  )
}
