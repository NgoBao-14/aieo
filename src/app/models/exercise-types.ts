export const READING_EXERCISE_TYPES = [
  'Matching Headings',
  'Matching Features',
  'Matching Information',
  'Matching Sentence Endings',
  'Multiple Choice',
  'Multiple Choice (Multiple Answers)',
  'True - False - Not Given',
  'Yes - No - Not Given',
  'Note Completion',
  'Summary Completion',
  'Sentence Completion',
  'Table Completion',
  'Flow-chart Completion',
  'Diagram Labeling',
  'Short Answer Questions'
] as const;

export const LISTENING_EXERCISE_TYPES = [
  'Form Completion',
  'Note Completion',
  'Table Completion',
  'Flow-chart Completion',
  'Summary Completion',
  'Sentence Completion',
  'Short Answer Questions',
  'Map Labelling',
  'Plan/Map/Diagram Labelling',
  'Matching Features',
  'Matching Information',
  'Multiple Choice',
  'Multiple Choice (Multiple Answers)'
] as const;

export const EXERCISE_TYPES_BY_SKILL = {
  Reading: [...READING_EXERCISE_TYPES],
  Listening: [...LISTENING_EXERCISE_TYPES]
} as const;
