export type SceneId = 'orchard' | 'garden' | 'classroom' | 'shop';
export type Layout = 'horizontal' | 'vertical';

export interface Question {
  word: string;
  wordPinyin: string;
  fullWord: string;
  fullPinyin: string;
  parts: string[];
  fruit: string;
  fruitEmoji?: string;
  layout: Layout;
}

export interface Level {
  id: SceneId;
  name: string;
  icon: string;
  description: string;
  questions: Question[];
}

export interface GameState {
  levelIndex: number;
  questionIndex: number;
  questions: Question[];
  unlocked: Set<number>;
  completedLevels: Set<number>;
  sound: boolean;
  score: number;
  streak: number;
}
