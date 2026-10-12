import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import { AdditiveBlending, DoubleSide, ShaderMaterial } from 'three'
import { SUN_DISTANCE, SUN_RADIUS } from '../lib/scale'

const PHOTO_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vW;
varying vec3 vObj;
void main() {
  vObj = position;
  vN = normalize(normalMatrix * normal);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`

const PHOTO_FRAG = /* glsl */ `
uniform float uTime;
varying vec3 vN;
varying vec3 vW;
varying vec3 vObj;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.13));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(
      mix(hash(i), hash(i + vec3(1, 0, 0)), f.x),
      mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x),
      f.y
    ),
    mix(
      mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
      mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x),
      f.y
    ),
    f.z
  );
}

float fbm(vec3 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    s += a * vnoise(p);
    p = p * 2.07 + 0.13;
    a *= 0.5;
  }
  return s;
}

void main() {
  vec3 V = normalize(cameraPosition - vW);
  vec3 N = normalize(vN);
  float mu = max(dot(N, V), 0.0);

  float limb = 0.45 + 0.55 * mu;

  vec3 p = normalize(vObj);
  float t = uTime * 0.035;
  float gran = fbm(p * 18.0 + vec3(t, t * 0.4, -t * 0.25));
  float cells = fbm(p * 42.0 - vec3(t * 0.6));
  float surface = 0.72 + 0.28 * gran + 0.12 * cells;

  float spots = smoothstep(0.62, 0.48, fbm(p * 4.5 + 2.7));
  surface *= mix(1.0, 0.22, spots * 0.85);

  vec3 core = vec3(0.96, 0.78, 0.52);
  vec3 mid = vec3(0.88, 0.55, 0.28);
  vec3 edge = vec3(0.62, 0.28, 0.1);
  vec3 col = mix(edge, mix(mid, core, pow(mu, 0.7)), limb);
  col *= surface;

  gl_FragColor = vec4(col, 1.0);
}
`

const CHROMA_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vW;
void main() {
  vN = normalize(normalMatrix * normal);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`

const CHROMA_FRAG = /* glsl */ `
varying vec3 vN;
varying vec3 vW;
void main() {
  vec3 V = normalize(cameraPosition - vW);
  float f = pow(1.0 - max(dot(normalize(vN), V), 0.0), 6.5);
  vec3 col = mix(vec3(0.85, 0.32, 0.08), vec3(1.0, 0.62, 0.28), f);
  gl_FragColor = vec4(col, clamp(f * 0.7, 0.0, 0.35));
}
`

export function Lighting({
  mode = 'parallel',
}: {
  mode?: 'parallel' | 'point'
}) {
  if (mode === 'point') {
    return (
      <>
        <ambientLight intensity={0.045} color="#9aa7bb" />
        <hemisphereLight args={['#142033', '#05070c', 0.18]} />
        <pointLight position={[0, 0, 0]} intensity={85} distance={48} decay={2} color="#fff4e0" />
      </>
    )
  }
  return (
    <>
      <ambientLight intensity={0.022} color="#6d7a8c" />
      <hemisphereLight args={['#0c1424', '#03040a', 0.1]} />
      <directionalLight
        position={[SUN_DISTANCE, 0, 0]}
        intensity={3.6}
        color="#fff6e8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00025}
        shadow-normalBias={0.03}
        shadow-camera-near={4}
        shadow-camera-far={70}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
      />
    </>
  )
}

export function Sun({
  position = [SUN_DISTANCE, 0, 0] as [number, number, number],
  size = SUN_RADIUS,
}: {
  position?: [number, number, number]
  size?: number
}) {
  const photo = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: PHOTO_VERT,
        fragmentShader: PHOTO_FRAG,
        uniforms: { uTime: { value: 0 } },
      }),
    [],
  )
  const chroma = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: CHROMA_VERT,
        fragmentShader: CHROMA_FRAG,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [],
  )

  useFrame((_, dt) => {
    photo.uniforms.uTime.value += dt
  })

  return (
    <group position={position}>
      <mesh material={photo}>
        <sphereGeometry args={[size, 96, 96]} />
      </mesh>
      <mesh material={chroma} scale={1.012}>
        <sphereGeometry args={[size, 64, 64]} />
      </mesh>
    </group>
  )
}

const RAY_OFFSETS: [number, number][] = [
  [0, 0],
  [1.15, 0.2],
  [-0.95, 0.55],
  [0.4, -1.05],
  [-0.7, -0.75],
  [0.15, 1.2],
]

export function SunRays() {
  const origin = SUN_DISTANCE - SUN_RADIUS - 0.4
  const length = origin - 1.6
  const mid = 1.6 + length / 2

  return (
    <group>
      {RAY_OFFSETS.map(([y, z], i) => (
        <mesh key={i} position={[mid, y, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.014, 0.014, length, 8]} />
          <meshBasicMaterial
            color="#F4C989"
            transparent
            opacity={i === 0 ? 0.22 : 0.11}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
      <mesh position={[mid, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.2, 0.45, length, 24, 1, true]} />
        <meshBasicMaterial
          color="#F4C989"
          transparent
          opacity={0.035}
          side={DoubleSide}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

export function Sunbeam() {
  return <SunRays />
}
