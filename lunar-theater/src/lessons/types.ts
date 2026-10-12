import type { ComponentType } from 'react'
import type { CameraPreset } from '../theater/types'

export type LessonStatus = 'ready' | 'coming'

export type Beat = {
  start: number
  end: number
  title: string
  body: string
  camera: CameraPreset
  extra: boolean
  t?: number
  tFrom?: number
  tTo?: number
}

export type LessonSceneProps = {
  variant: 'space' | 'earth'
}

export type TimelineMark = {
  t: number
  label: string
}

export type InsetCaption = {
  name: string
  short: string
}

export type Lesson = {
  id: string
  title: string
  blurb: string
  status: LessonStatus
  durationSec: number
  periodDays: number
  periodUnit: string
  timelineAria: string
  speedExploreHint: string
  scaleNote: string
  extraLabel: string | null
  marks: TimelineMark[]
  presets: { id: CameraPreset; label: string }[]
  insetKicker: string | null
  spaceCamera: { position: [number, number, number]; fov: number }
  beats: Beat[]
  Scene: ComponentType<LessonSceneProps>
  insetCaption: (t: number, extra: boolean) => InsetCaption
  exploreCopy: (t: number, extra: boolean) => { title: string; body: string }
}
