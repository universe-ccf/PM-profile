import type { Beat } from '../lessons/types'

function easeInOut(u: number) {
  return u * u * (3 - 2 * u)
}

export function beatAt(beats: Beat[], time: number, duration: number) {
  const t = Math.min(Math.max(time, 0), duration)
  return beats.find((b) => t >= b.start && t < b.end) ?? beats[beats.length - 1]
}

export function phaseAtDemoTime(beats: Beat[], time: number, duration: number) {
  const beat = beatAt(beats, time, duration)
  if (beat.t != null) return beat.t
  const span = Math.max(beat.end - beat.start, 1e-4)
  const u = easeInOut(Math.min(1, Math.max(0, (time - beat.start) / span)))
  const from = beat.tFrom ?? 0
  const to = beat.tTo ?? from
  return from + (to - from) * u
}
