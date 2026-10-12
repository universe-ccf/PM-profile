import { useEffect } from 'react'
import { DualView } from './DualView'
import { LessonSwitch } from './LessonSwitch'
import { Narration } from './Narration'
import { Timeline } from './Timeline'
import { Toggles } from './Toggles'
import { useTheater } from '../theater/TheaterContext'

export function Shell() {
  const { togglePlaying, lesson } = useTheater()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      const el = e.target as HTMLElement | null
      const tag = el?.tagName
      const type = (el as HTMLInputElement | undefined)?.type
      if (tag === 'TEXTAREA' || tag === 'SELECT') return
      if (tag === 'INPUT' && type !== 'range') return
      e.preventDefault()
      togglePlaying()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePlaying])

  return (
    <div className="shell">
      <header className="mast">
        <div className="brand">
          <h1>朔望</h1>
          <p>日地月教学剧场</p>
        </div>
        <LessonSwitch />
      </header>

      <DualView />

      <footer className="console">
        <Narration />
        <div className="console-main">
          <Timeline />
          <Toggles />
          <p className="scale-note">{lesson.scaleNote}</p>
        </div>
      </footer>
    </div>
  )
}
