import { AdditiveBlending, BackSide, Color, SRGBColorSpace } from 'three'
import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import type { Group, Texture } from 'three'
import { EARTH_RADIUS } from '../lib/scale'
import { useTheater } from '../theater/context'

const ATM_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vW;
void main() {
  vN = normalize(normalMatrix * normal);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`

const ATM_FRAG = /* glsl */ `
uniform vec3 glowColor;
varying vec3 vN;
varying vec3 vW;
void main() {
  vec3 V = normalize(cameraPosition - vW);
  float f = pow(1.0 - abs(dot(normalize(vN), V)), 2.65);
  gl_FragColor = vec4(glowColor, clamp(f * 0.92, 0.0, 1.0));
}
`

function prepColor(tex: Texture) {
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 8
}

export function Earth({ spin = 0.04 }: { spin?: number }) {
  const group = useRef<Group>(null)
  const { playing } = useTheater()
  const textureBase = `${import.meta.env.BASE_URL}textures/`
  const [albedo, specular, normal, lights] = useTexture([
    `${textureBase}earth.jpg`,
    `${textureBase}earth-specular.jpg`,
    `${textureBase}earth-normal.jpg`,
    `${textureBase}earth-lights.jpg`,
  ])

  useLayoutEffect(() => {
    prepColor(albedo)
    prepColor(lights)
    specular.anisotropy = 8
    normal.anisotropy = 8
  }, [albedo, specular, normal, lights])

  useFrame((_, dt) => {
    if (group.current && spin && playing) group.current.rotation.y += dt * spin
  })

  return (
    <group>
      <group ref={group} rotation={[0, 0.4, 0]}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
          <meshStandardMaterial
            map={albedo}
            roughness={0.42}
            metalness={0.02}
            bumpMap={specular}
            bumpScale={0.035}
            normalMap={normal}
            emissive="#ffd4a8"
            emissiveMap={lights}
            emissiveIntensity={0.52}
            fog={false}
          />
        </mesh>
      </group>
      <mesh scale={1.018} renderOrder={1}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <shaderMaterial
          vertexShader={ATM_VERT}
          fragmentShader={ATM_FRAG}
          uniforms={{ glowColor: { value: new Color('#9fd4f2') } }}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>
      <mesh scale={1.055}>
        <sphereGeometry args={[EARTH_RADIUS, 48, 48]} />
        <meshBasicMaterial
          color="#7EA8C8"
          transparent
          opacity={0.1}
          side={BackSide}
          depthWrite={false}
          fog={false}
        />
      </mesh>
    </group>
  )
}
