import { lessons } from '../lessons/registry'
import { useTheater } from '../theater/TheaterContext'

export function LessonSwitch() {
  const { lessonId, setLesson } = useTheater()

  return (
    <nav className="lessons" aria-label="课程">
      {lessons.map((lesson) => {
        const on = lesson.id === lessonId
        return (
          <button
            key={lesson.id}
            type="button"
            className={on ? 'lesson-tab is-on' : 'lesson-tab'}
            onClick={() => setLesson(lesson.id)}
            title={lesson.blurb}
          >
            {lesson.title}
          </button>
        )
      })}
    </nav>
  )
}
