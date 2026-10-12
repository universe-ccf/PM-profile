import { MoonPhaseScene } from './MoonPhaseScene'
import { MOON_PHASE_BEATS } from './beats'
import { DEMO_DURATION, SYNODIC_DAYS } from '../../lib/scale'
import { isNearFull, phaseInfo } from '../../lib/moonOrbit'
import type { Lesson } from '../types'

export const moonPhaseLesson: Lesson = {
  id: 'moon-phases',
  title: '月相',
  blurb: '从空间和地面同时看见，为什么月亮会缺一块。',
  status: 'ready',
  durationSec: DEMO_DURATION,
  periodDays: SYNODIC_DAYS,
  periodUnit: '朔望月',
  timelineAria: '朔望月进度',
  speedExploreHint: '一秒一日',
  scaleNote: '为看清结构已压缩距离。阳光从右侧平行射来。轨道倾角约 5°。',
  extraLabel: '地球影子',
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
  spaceCamera: { position: [1.8, 9.2, 32], fov: 46 },
  beats: MOON_PHASE_BEATS,
  Scene: MoonPhaseScene,
  insetCaption: (t) => {
    const p = phaseInfo(t)
    return { name: p.name, short: p.short }
  },
  exploreCopy: (t, extra) => {
    const { name, short } = phaseInfo(t)
    if (extra && isNearFull(t)) {
      return {
        title: `${name} · ${short}`,
        body: '地球影子在这里。这个月，月亮从旁边过去。',
      }
    }
    if (extra) {
      return {
        title: `${name} · ${short}`,
        body: '影子一直在地球背后。月相是看亮面的角度，不是走进影子。',
      }
    }
    return {
      title: `${name} · ${short}`,
      body: '右上角是站在地球上看。两边是同一颗月亮。',
    }
  },
}
