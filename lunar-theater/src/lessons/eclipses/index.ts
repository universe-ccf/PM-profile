import { EclipseScene } from './EclipseScene'
import { ECLIPSE_BEATS, eclipseExploreCopy } from './beats'
import { DEMO_DURATION, SYNODIC_DAYS } from '../../lib/scale'
import { isNearFull, isNearNew, phaseInfo } from '../../lib/moonOrbit'
import type { Lesson } from '../types'

export const eclipsesLesson: Lesson = {
  id: 'eclipses',
  title: '日食',
  blurb: '什么时候月亮才会走进地球的影子。',
  status: 'ready',
  durationSec: DEMO_DURATION,
  periodDays: SYNODIC_DAYS,
  periodUnit: '朔望月',
  timelineAria: '朔望月进度',
  speedExploreHint: '一秒一日',
  scaleNote: '为看清结构已压缩距离。打开「轨道共面」可看见食，真实白道斜约 5°。',
  extraLabel: '轨道共面',
  marks: [
    { t: 0, label: '朔' },
    { t: 0.25, label: '上弦' },
    { t: 0.5, label: '望' },
    { t: 0.75, label: '下弦' },
  ],
  presets: [
    { id: 'overview', label: '总览' },
    { id: 'side', label: '侧面' },
    { id: 'earth', label: '地上' },
  ],
  insetKicker: '地上所见',
  spaceCamera: { position: [22, 14, 28], fov: 40 },
  beats: ECLIPSE_BEATS,
  Scene: EclipseScene,
  insetCaption: (t, extra) => {
    if (extra && isNearNew(t)) return { name: '日食', short: '挡太阳' }
    if (extra && isNearFull(t)) return { name: '月食', short: '进影子' }
    const p = phaseInfo(t)
    return { name: p.name, short: p.short }
  },
  exploreCopy: eclipseExploreCopy,
}
