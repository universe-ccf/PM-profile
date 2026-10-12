import { InteriorScene } from './InteriorScene'
import { INTERIOR_BEATS, INTERIOR_DURATION, interiorExploreCopy, layerInfo } from './beats'
import type { Lesson } from '../types'

export const interiorLesson: Lesson = {
  id: 'interior',
  title: '内部',
  blurb: '从太空走进地球的层。',
  status: 'ready',
  durationSec: INTERIOR_DURATION,
  periodDays: 4,
  periodUnit: '层',
  timelineAria: '深度',
  speedExploreHint: '一层一圈',
  scaleNote: '地壳厚度做了夸张，否则薄得看不见。半径比例大约保留。',
  extraLabel: '剖开',
  marks: [
    { t: 0, label: '地壳' },
    { t: 0.25, label: '地幔' },
    { t: 0.5, label: '外核' },
    { t: 0.75, label: '内核' },
  ],
  presets: [
    { id: 'overview', label: '总览' },
    { id: 'side', label: '剖面' },
    { id: 'earth', label: '内核' },
  ],
  insetKicker: null,
  spaceCamera: { position: [2.6, 1.7, -5.4], fov: 40 },
  beats: INTERIOR_BEATS,
  Scene: InteriorScene,
  insetCaption: (t) => {
    const layer = layerInfo(t)
    return { name: layer.name, short: layer.short }
  },
  exploreCopy: interiorExploreCopy,
}
