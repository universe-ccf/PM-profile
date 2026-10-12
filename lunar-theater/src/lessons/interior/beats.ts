import type { Beat } from '../types'

export const INTERIOR_DURATION = 62

export const INTERIOR_BEATS: Beat[] = [
  {
    start: 0,
    end: 10,
    t: 0.05,
    camera: 'overview',
    extra: false,
    title: '完整的地球',
    body: '从外面看，只见地壳这一层薄壳。',
  },
  {
    start: 10,
    end: 20,
    t: 0.12,
    camera: 'side',
    extra: true,
    title: '剖开',
    body: '切掉四分之一。最外是地壳，薄得像蛋壳。',
  },
  {
    start: 20,
    end: 32,
    tFrom: 0.12,
    tTo: 0.38,
    camera: 'side',
    extra: true,
    title: '地幔',
    body: '占体积的大半。固态岩石，但会缓慢对流。',
  },
  {
    start: 32,
    end: 44,
    tFrom: 0.38,
    tTo: 0.62,
    camera: 'side',
    extra: true,
    title: '外核',
    body: '液态铁镍。流动产生地球磁场。',
  },
  {
    start: 44,
    end: 54,
    tFrom: 0.62,
    tTo: 0.88,
    camera: 'earth',
    extra: true,
    title: '内核',
    body: '固态铁镍。压力太大，反而凝成固体。',
  },
  {
    start: 54,
    end: INTERIOR_DURATION,
    t: 0.88,
    camera: 'overview',
    extra: true,
    title: '自己看看层',
    body: '拖动时间轴，一层层走进去。关掉「剖开」就回到整球。',
  },
]

const LAYERS = [
  { name: '地壳', short: '岩石薄壳' },
  { name: '地幔', short: '对流的固体' },
  { name: '外核', short: '液态铁镍' },
  { name: '内核', short: '固态铁镍' },
] as const

export function layerIndex(t: number) {
  const x = ((t % 1) + 1) % 1
  if (x < 0.25) return 0
  if (x < 0.5) return 1
  if (x < 0.75) return 2
  return 3
}

export function layerInfo(t: number) {
  return LAYERS[layerIndex(t)]
}

export function interiorExploreCopy(t: number, extra: boolean) {
  const layer = layerInfo(t)
  if (!extra) {
    return { title: '完整的地球', body: '打开「剖开」，才能看见里面的层。' }
  }
  return {
    title: layer.name,
    body: layer.short + '。时间轴对应深度，不是日期。',
  }
}
