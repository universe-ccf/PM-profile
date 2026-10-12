import type { Beat } from '../types'
import { DEMO_DURATION } from '../../lib/scale'
import { seasonInfo } from '../../lib/seasons'

export const SEASON_BEATS: Beat[] = [
  {
    start: 0,
    end: 12,
    t: 0,
    camera: 'overview',
    extra: false,
    title: '地轴是歪的',
    body: '不是地球离太阳的远近在换季。地轴固定斜约 23.5°。',
  },
  {
    start: 12,
    end: 24,
    t: 0,
    camera: 'side',
    extra: false,
    title: '北极此刻背着太阳',
    body: '这是北半球的冬天。右上角从北极往下看，是极夜。',
  },
  {
    start: 24,
    end: 40,
    tFrom: 0,
    tTo: 0.5,
    camera: 'overview',
    extra: false,
    title: '转到北夏',
    body: '地轴方向不变。地球转到另一侧，北极对着太阳。',
  },
  {
    start: 40,
    end: 52,
    t: 0.5,
    camera: 'earth',
    extra: false,
    title: '北极极昼',
    body: '整个北极圈都在光里。南极此时是极夜。',
  },
  {
    start: 52,
    end: 64,
    t: 0.5,
    camera: 'side',
    extra: true,
    title: '若没有轴倾',
    body: '把轴扶正。南北半球一年到头一样亮，也就没有四季。',
  },
  {
    start: 64,
    end: DEMO_DURATION,
    tFrom: 0.5,
    tTo: 0.75,
    camera: 'overview',
    extra: true,
    title: '自己转转看',
    body: '打开或关掉「去掉轴倾」。看北极那一窗，比看日历更清楚。',
  },
]

export function seasonExploreCopy(t: number, extra: boolean) {
  const s = seasonInfo(t)
  if (extra) {
    return {
      title: '没有轴倾',
      body: '阳光一年到头直射赤道附近。南北半球一样，极昼极夜消失。',
    }
  }
  return {
    title: `${s.name} · ${s.short}`,
    body: `北极此刻是${s.north}。地轴方向没变，变的是地球走到了公转的哪一边。`,
  }
}
