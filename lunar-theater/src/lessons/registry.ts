import type { Lesson } from './types'
import { moonPhaseLesson } from './moon-phases'
import { seasonsLesson } from './seasons'
import { eclipsesLesson } from './eclipses'
import { interiorLesson } from './interior'

export const lessons: Lesson[] = [
  moonPhaseLesson,
  seasonsLesson,
  eclipsesLesson,
  interiorLesson,
]

export function getLesson(id: string) {
  return lessons.find((l) => l.id === id) ?? lessons[0]
}
