export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  provider: 'firebase' | 'demo';
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  rank: 'novice' | 'scout' | 'knight' | 'master';
  targetBand: number;
  stats: {
    reading: Record<string, number>;
    listening: Record<string, number>;
  };
  createdAt: string;
}

export interface Question {
  id: number;
  type?: string;
  text?: string;
  options?: string[];
}

export interface QuestionGroup {
  id: string;
  type: string;
  range: string;
  instructions: string;
  renderType?: string;
  inputType?: string;
  interaction?: string;
  template?: string;
  headings?: string[];
  options?: string[];
  columns?: string[];
  text?: string;
  questions: Question[];
}

export interface TestPart {
  id: string;
  number: number;
  title: string;
  passageHtml?: string;
  audioUrl?: string;
  questionTypes?: string[];
  questionGroups: QuestionGroup[];
}

export interface Test {
  id: string;
  title: string;
  skill: 'Reading' | 'Listening';
  source: string;
  attempts?: number;
  parts: TestPart[];
  answerKey: Record<string, string>;
  explanations: Record<string, string>;
  createdAt?: string;
  partsCount?: number;
  questionCount?: number;
  questionTypes?: string[];
}

export interface Submission {
  id: string;
  userId: string;
  testId: string;
  testTitle: string;
  skill: 'Reading' | 'Listening';
  answers: Record<string, string>;
  score: number;
  bandScore: number;
  createdAt: string;
}
