import { createContext, useContext } from 'react'
import type { CameraPreset, TheaterMode } from './types'
import type { Beat, Lesson } from '../lessons/types'

export type TheaterValue = {
  lesson: Lesson
  lessonId: string
  t: number
  tRef: React.RefObject<number>
  playing: boolean
  mode: TheaterMode
  speed: number
  showLabels: boolean
  extra: boolean
  cameraPreset: CameraPreset
  beat: Beat | null
  notice: string | null
  title: string
  body: string
  setLesson: (id: string) => void
  setPlaying: (v: boolean) => void
  togglePlaying: () => void
  setSpeed: (v: number) => void
  setShowLabels: (v: boolean) => void
  setExtra: (v: boolean) => void
  setCameraPreset: (v: CameraPreset) => void
  scrub: (t: number) => void
  replay: () => void
  setNotice: (v: string | null) => void
}

export const TheaterContext = createContext<TheaterValue | null>(null)

export function useTheater() {
  const ctx = useContext(TheaterContext)
  if (!ctx) throw new Error('useTheater must be used within TheaterProvider')
  return ctx
}
