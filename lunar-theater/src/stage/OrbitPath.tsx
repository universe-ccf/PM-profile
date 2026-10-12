import { Line, Html } from '@react-three/drei'
import { useMemo } from 'react'
import { orbitPoints, moonPosition } from '../lib/moonOrbit'
import { ORBIT_INCLINATION_DEG } from '../lib/scale'

const MARKS = [
  { t: 0, label: '朔' },
  { t: 0.25, label: '上弦' },
  { t: 0.5, label: '望' },
  { t: 0.75, label: '下弦' },
] as const

export function OrbitPath({
  showLabels,
  inclinationDeg = ORBIT_INCLINATION_DEG,
}: {
  showLabels: boolean
  inclinationDeg?: number
}) {
  const pts = useMemo(() => orbitPoints(160, inclinationDeg), [inclinationDeg])
  const marks = useMemo(
    () => MARKS.map((m) => ({ ...m, p: moonPosition(m.t, undefined, inclinationDeg) })),
    [inclinationDeg],
  )

  return (
    <group>
      <Line points={pts} color="#9ec4dc" transparent opacity={0.48} lineWidth={1.15} />
      {showLabels &&
        marks.map((m) => (
          <Html
            key={m.label}
            position={[m.p.x * 1.06, m.p.y * 1.06, m.p.z * 1.06]}
            center
            style={{ pointerEvents: 'none' }}
          >
            <span className="orbit-mark">{m.label}</span>
          </Html>
        ))}
    </group>
  )
}
