import type { Beat } from '../types'
import { DEMO_DURATION } from '../../lib/scale'
import { isNearFull, isNearNew, phaseInfo } from '../../lib/moonOrbit'

export const ECLIPSE_BEATS: Beat[] = [
  {
    start: 0,
    end: 12,
    t: 0.5,
    camera: 'overview',
    extra: false,
    title: '影子一直在',
    body: '地球背后有一条影子。多数满月，月亮从旁边过去。',
  },
  {
    start: 12,
    end: 24,
    t: 0.5,
    camera: 'side',
    extra: false,
    title: '白道是斜的',
    body: '月球轨道相对日地平面斜约 5°。所以不是每月都有月食。',
  },
  {
    start: 24,
    end: 38,
    t: 0.5,
    camera: 'side',
    extra: true,
    title: '若轨道共面',
    body: '把倾角抹平。满月就会走进地球的影子。这是月食。',
  },
  {
    start: 38,
    end: 52,
    tFrom: 0.5,
    tTo: 1,
    camera: 'overview',
    extra: true,
    title: '转到朔',
    body: '月亮跑到太阳和地球中间。共面时，它会挡住太阳。',
  },
  {
    start: 52,
    end: 64,
    t: 0,
    camera: 'earth',
    extra: true,
    title: '日食',
    body: '右上角从地球看太阳。月亮从前面经过。这是日食。',
  },
  {
    start: 64,
    end: DEMO_DURATION,
    t: 0,
    camera: 'overview',
    extra: false,
    title: '自己对照',
    body: '打开「轨道共面」看食，关掉就回到平常的月相。',
  },
]

export function eclipseExploreCopy(t: number, extra: boolean) {
  const { name, short } = phaseInfo(t)
  if (extra && isNearFull(t)) {
    return { title: '月食', body: '轨道共面，满月走进地球影子。月亮变暗，不是缺一块。' }
  }
  if (extra && isNearNew(t)) {
    return { title: '日食', body: '轨道共面，新月挡在太阳前面。右上角看太阳被遮住。' }
  }
  if (extra) {
    return { title: `${name} · 共面`, body: '共面之后，每个朔都会日食，每个望都会月食。真实的白道不是这样。' }
  }
  if (isNearFull(t)) {
    return { title: `${name} · ${short}`, body: '有倾角时，满月通常从影子旁边过去。' }
  }
  return { title: `${name} · ${short}`, body: '食只发生在朔或望，还要轨道几乎共面。' }
}
