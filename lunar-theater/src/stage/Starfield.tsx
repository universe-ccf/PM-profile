import { useMemo } from 'react'
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  ShaderMaterial,
} from 'three'

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const SKY_FRAG = /* glsl */ `
varying vec3 vDir;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.17, 0.13));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z
  );
}

float fbm(vec3 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    s += a * vnoise(p);
    p = p * 2.11 + 0.17;
    a *= 0.52;
  }
  return s;
}

void main() {
  vec3 d = normalize(vDir);
  float lat = d.y;
  float band = exp(-pow((lat - 0.04) * 2.4, 2.0));
  float dust = fbm(d * 3.4);
  float lanes = smoothstep(0.35, 0.7, fbm(d * 7.0 + 4.0));
  vec3 dark = vec3(0.004, 0.006, 0.012);
  vec3 glow = mix(vec3(0.07, 0.08, 0.12), vec3(0.16, 0.12, 0.08), dust);
  vec3 col = dark + glow * band * (0.55 - 0.35 * lanes);
  col += vec3(0.03, 0.05, 0.09) * pow(max(0.0, 1.0 - abs(lat)), 4.0) * 0.15;
  gl_FragColor = vec4(col, 1.0);
}
`

const STAR_VERT = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
uniform float uPixel;
varying vec3 vColor;
varying float vBright;
void main() {
  vColor = aColor;
  vBright = aSize;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPixel * (300.0 / max(60.0, -mv.z));
}
`

const STAR_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vBright;
void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  float d = length(c);
  if (d > 0.5) discard;
  float core = pow(1.0 - d * 2.0, 2.4);
  float halo = pow(1.0 - d * 2.0, 1.1) * 0.35;
  float a = clamp(core + halo, 0.0, 1.0);
  a *= smoothstep(0.0, 0.9, vBright / 8.0);
  gl_FragColor = vec4(vColor, a);
}
`

function starGeometry(count: number, r0: number, rSpan: number) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const c = new Color()

  for (let i = 0; i < count; i++) {
    const u = Math.random()
    const v = Math.random()
    const theta = 2 * Math.PI * u
    let phi = Math.acos(2 * v - 1)
    if (Math.random() < 0.42) {
      phi = Math.PI / 2 + (Math.random() - 0.5) * 0.42
    }
    const r = r0 + Math.random() * rSpan
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)

    const mag = Math.pow(Math.random(), 3.2)
    const kind = Math.random()
    if (kind > 0.92) c.setRGB(0.62, 0.76, 1)
    else if (kind > 0.78) c.setRGB(0.78, 0.88, 1)
    else if (kind > 0.55) c.setRGB(1, 0.96, 0.9)
    else if (kind > 0.28) c.setRGB(1, 0.86, 0.62)
    else c.setRGB(1, 0.68, 0.42)

    const lum = 0.35 + mag * 0.85
    colors[i * 3] = c.r * lum
    colors[i * 3 + 1] = c.g * lum
    colors[i * 3 + 2] = c.b * lum
    sizes[i] = 0.7 + mag * 4.8
  }

  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(positions, 3))
  geo.setAttribute('aColor', new BufferAttribute(colors, 3))
  geo.setAttribute('aSize', new BufferAttribute(sizes, 1))
  return geo
}

export function Starfield({
  dense = false,
  near = false,
}: {
  dense?: boolean
  near?: boolean
}) {
  const count = near ? 2200 : dense ? 14000 : 7000
  const geometry = useMemo(
    () => starGeometry(count, near ? 48 : 380, near ? 22 : 420),
    [count, near],
  )
  const sky = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        side: BackSide,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
    [],
  )
  const stars = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: STAR_VERT,
        fragmentShader: STAR_FRAG,
        uniforms: { uPixel: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 1 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    [],
  )
  const radius = near ? 78 : 980

  return (
    <group>
      <mesh material={sky} frustumCulled={false}>
        <sphereGeometry args={[radius, 64, 48]} />
      </mesh>
      <points geometry={geometry} material={stars} frustumCulled={false} />
    </group>
  )
}
