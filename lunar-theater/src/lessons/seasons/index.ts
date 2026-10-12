import { SeasonsScene } from './SeasonsScene'
import { SEASON_BEATS, seasonExploreCopy } from './beats'
import { DEMO_DURATION, YEAR_DAYS } from '../../lib/scale'
import { seasonInfo } from '../../lib/seasons'
import type { Lesson } from '../types'

export const seasonsLesson: Lesson = {
  id: 'seasons',
  title: '四季',
  blurb: '轴倾如何改变南北半球的日照。',
  status: 'ready',
  durationSec: DEMO_DURATION,
  periodDays: YEAR_DAYS,
  periodUnit: '年',
  timelineAria: '一年进度',
  speedExploreHint: '一秒一日',
  scaleNote: '为看清结构已压缩距离。地轴斜约 23.5°，方向在空间中不变。',
  extraLabel: '去掉轴倾',
  marks: [
    { t: 0, label: '冬' },
    { t: 0.25, label: '春' },
    { t: 0.5, label: '夏' },
    { t: 0.75, label: '秋' },
  ],
  presets: [
    { id: 'overview', label: '总览' },
    { id: 'side', label: '侧面' },
    { id: 'earth', label: '北极' },
  ],
  insetKicker: '北极俯视',
  spaceCamera: { position: [4, 16, 22], fov: 42 },
  beats: SEASON_BEATS,
  Scene: SeasonsScene,
  insetCaption: (t, extra) => {
    if (extra) return { name: '无轴倾', short: '无极昼夜' }
    const s = seasonInfo(t)
    return { name: s.name, short: s.north }
  },
  exploreCopy: seasonExploreCopy,
}
