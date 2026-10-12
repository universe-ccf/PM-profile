import { Vector3 } from 'three'
import { AXIAL_TILT_DEG, EARTH_ORBIT, YEAR_DAYS } from './scale'
import { wrap01 } from './moonOrbit'

const DEG = Math.PI / 180

export function earthOrbitPosition(t: number, out = new Vector3()) {
  const a = wrap01(t) * Math.PI * 2
  return out.set(EARTH_ORBIT * Math.cos(a), 0, EARTH_ORBIT * Math.sin(a))
}

/** North pole direction with tilt toward +X, fixed in space. */
export function northPoleDir(tiltDeg = AXIAL_TILT_DEG, out = new Vector3()) {
  const i = tiltDeg * DEG
  return out.set(Math.sin(i), Math.cos(i), 0)
}

export function seasonInfo(t: number) {
  const x = wrap01(t)
  if (x < 0.06 || x >= 0.94) return { name: '北冬', short: '冬至前后', north: '极夜' }
  if (x < 0.2) return { name: '北冬末', short: '向春', north: '长夜' }
  if (x < 0.3) return { name: '北春', short: '春分前后', north: '昼夜平' }
  if (x < 0.44) return { name: '北春末', short: '向夏', north: '长昼' }
  if (x < 0.56) return { name: '北夏', short: '夏至前后', north: '极昼' }
  if (x < 0.7) return { name: '北夏末', short: '向秋', north: '长昼' }
  if (x < 0.8) return { name: '北秋', short: '秋分前后', north: '昼夜平' }
  return { name: '北秋末', short: '向冬', north: '长夜' }
}

export function yearDay(t: number) {
  return wrap01(t) * YEAR_DAYS
}
