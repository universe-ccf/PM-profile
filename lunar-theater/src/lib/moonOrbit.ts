import { Matrix4, Quaternion, Vector3 } from 'three'
import {
  MOON_DISTANCE,
  ORBIT_INCLINATION_DEG,
  SYNODIC_DAYS,
} from './scale'

const DEG = Math.PI / 180
const UP = new Vector3(0, 1, 0)
const ORIGIN = new Vector3(0, 0, 0)
const LOOK = new Matrix4()
const FACE_EARTH = new Quaternion().setFromAxisAngle(UP, -Math.PI / 2)

export type PhaseInfo = {
  name: string
  short: string
}

export function wrap01(t: number) {
  return ((t % 1) + 1) % 1
}

export function phaseInfo(t: number): PhaseInfo {
  const x = wrap01(t)
  if (x < 0.03 || x >= 0.97) return { name: '朔', short: '新月' }
  if (x < 0.22) return { name: '蛾眉月', short: '渐盈' }
  if (x < 0.28) return { name: '上弦', short: '上弦' }
  if (x < 0.47) return { name: '盈凸月', short: '渐盈' }
  if (x < 0.53) return { name: '望', short: '满月' }
  if (x < 0.72) return { name: '亏凸月', short: '渐亏' }
  if (x < 0.78) return { name: '下弦', short: '下弦' }
  return { name: '残月', short: '渐亏' }
}

export function isNearFull(t: number) {
  const x = wrap01(t)
  return x > 0.44 && x < 0.56
}

/** Moon position in teaching coordinates. φ=0 is new moon (toward the sun / +X). */
export function moonPosition(
  t: number,
  out = new Vector3(),
  inclinationDeg = ORBIT_INCLINATION_DEG,
) {
  const phase = wrap01(t) * Math.PI * 2
  const i = inclinationDeg * DEG
  const x0 = MOON_DISTANCE * Math.cos(phase)
  const z0 = -MOON_DISTANCE * Math.sin(phase)
  return out.set(x0 * Math.cos(i), x0 * Math.sin(i), z0)
}

/** Tidal lock: texture center (near side) faces Earth. */
export function moonQuaternion(position: Vector3, out = new Quaternion()) {
  LOOK.lookAt(position, ORIGIN, UP)
  out.setFromRotationMatrix(LOOK).multiply(FACE_EARTH)
  return out
}

export function synodicDay(t: number) {
  return wrap01(t) * SYNODIC_DAYS
}

export function orbitPoints(
  segments = 128,
  inclinationDeg = ORBIT_INCLINATION_DEG,
) {
  const pts: Vector3[] = []
  const v = new Vector3()
  for (let i = 0; i <= segments; i++) {
    pts.push(moonPosition(i / segments, v, inclinationDeg).clone())
  }
  return pts
}

export function isNearNew(t: number) {
  const x = wrap01(t)
  return x < 0.08 || x > 0.92
}
