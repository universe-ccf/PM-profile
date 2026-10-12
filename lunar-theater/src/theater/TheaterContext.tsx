import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { lessons, getLesson } from '../lessons/registry'
import { beatAt, phaseAtDemoTime } from '../lib/beats'
import type { CameraPreset, TheaterMode } from './types'
import { TheaterContext } from './context'

export { useTheater } from './context'

export function TheaterProvider({ children }: { children: ReactNode }) {
  const [lessonId, setLessonId] = useState(lessons[0].id)
  const lesson = getLesson(lessonId)
  const lessonRef = useRef(lesson)
  lessonRef.current = lesson

  const tRef = useRef(phaseAtDemoTime(lesson.beats, 0, lesson.durationSec))
  const demoRef = useRef(0)
  const [t, setT] = useState(tRef.current)
  const [demoTime, setDemoTime] = useState(0)
  const [playing, setPlayingState] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false
    }
    return true
  })
  const [mode, setMode] = useState<TheaterMode>('demo')
  const [speed, setSpeed] = useState(1)
  const [showLabels, setShowLabels] = useState(true)
  const [userExtra, setUserExtra] = useState(false)
  const [userPreset, setUserPreset] = useState<CameraPreset>('overview')
  const [notice, setNotice] = useState<string | null>(null)

  const modeRef = useRef(mode)
  const playingRef = useRef(playing)
  const speedRef = useRef(speed)
  modeRef.current = mode
  playingRef.current = playing
  speedRef.current = speed

  const setPlaying = useCallback((v: boolean) => {
    playingRef.current = v
    setPlayingState(v)
  }, [])

  const togglePlaying = useCallback(() => {
    const next = !playingRef.current
    playingRef.current = next
    setPlayingState(next)
  }, [])

  const resetToLesson = useCallback((next: typeof lesson) => {
    demoRef.current = 0
    tRef.current = phaseAtDemoTime(next.beats, 0, next.durationSec)
    setDemoTime(0)
    setT(tRef.current)
    setMode('demo')
    modeRef.current = 'demo'
    setPlaying(true)
    setUserExtra(false)
    setUserPreset('overview')
    setNotice(null)
  }, [setPlaying])

  const setLesson = useCallback(
    (id: string) => {
      const next = getLesson(id)
      if (next.status !== 'ready' || next.id === lessonRef.current.id) return
      setLessonId(next.id)
      resetToLesson(next)
    },
    [resetToLesson],
  )

  useEffect(() => {
    let id = 0
    let last = performance.now()
    let uiAcc = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const current = lessonRef.current
      if (playingRef.current) {
        if (modeRef.current === 'demo') {
          const next = demoRef.current + dt * speedRef.current
          if (next >= current.durationSec) {
            demoRef.current = current.durationSec
            tRef.current = phaseAtDemoTime(current.beats, current.durationSec, current.durationSec)
            modeRef.current = 'explore'
            playingRef.current = false
            setMode('explore')
            setPlayingState(false)
            setDemoTime(current.durationSec)
            setT(tRef.current)
            const lastBeat = beatAt(current.beats, current.durationSec, current.durationSec)
            setUserExtra(!!lastBeat.extra)
            setUserPreset(lastBeat.camera)
          } else {
            demoRef.current = next
            tRef.current = phaseAtDemoTime(current.beats, next, current.durationSec)
          }
        } else {
          tRef.current = (tRef.current + (dt * speedRef.current) / current.periodDays) % 1
        }
      }
      uiAcc += dt
      if (uiAcc > 0.05) {
        uiAcc = 0
        setT(tRef.current)
        if (modeRef.current === 'demo') setDemoTime(demoRef.current)
      }
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])

  const beat = mode === 'demo' ? beatAt(lesson.beats, demoTime, lesson.durationSec) : null
  const extra = mode === 'demo' ? !!beat?.extra : userExtra
  const cameraPreset = mode === 'demo' ? (beat?.camera ?? 'overview') : userPreset
  const copy =
    mode === 'demo' && beat
      ? { title: beat.title, body: beat.body }
      : lesson.exploreCopy(t, extra)

  const leaveDemo = useCallback((opts?: { keepPlaying?: boolean }) => {
    if (modeRef.current !== 'demo') return
    const current = lessonRef.current
    const b = beatAt(current.beats, demoRef.current, current.durationSec)
    setUserExtra(!!b.extra)
    setUserPreset(b.camera)
    modeRef.current = 'explore'
    setMode('explore')
    if (!opts?.keepPlaying) {
      playingRef.current = false
      setPlayingState(false)
    }
  }, [])

  const scrub = useCallback(
    (nt: number) => {
      const wrapped = ((nt % 1) + 1) % 1
      tRef.current = wrapped
      setT(wrapped)
      leaveDemo()
    },
    [leaveDemo],
  )

  const replay = useCallback(() => {
    resetToLesson(lessonRef.current)
  }, [resetToLesson])

  const value = useMemo(
    () => ({
      lesson,
      lessonId,
      t,
      tRef,
      playing,
      mode,
      speed,
      showLabels,
      extra,
      cameraPreset,
      beat,
      notice,
      title: copy.title,
      body: copy.body,
      setLesson,
      setPlaying,
      togglePlaying,
      setSpeed,
      setShowLabels,
      setExtra: (v: boolean) => {
        leaveDemo({ keepPlaying: true })
        setUserExtra(v)
      },
      setCameraPreset: (v: CameraPreset) => {
        leaveDemo({ keepPlaying: true })
        setUserPreset(v)
      },
      scrub,
      replay,
      setNotice,
    }),
    [
      lesson,
      lessonId,
      t,
      playing,
      mode,
      speed,
      showLabels,
      extra,
      cameraPreset,
      beat,
      notice,
      copy.title,
      copy.body,
      setLesson,
      setPlaying,
      togglePlaying,
      scrub,
      replay,
      leaveDemo,
    ],
  )

  return <TheaterContext.Provider value={value}>{children}</TheaterContext.Provider>
}
