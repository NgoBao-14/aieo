#!/usr/bin/env node

/**
 * Generate sample Excel files for testing
 * Usage: node scripts/generate-sample-excel.js
 *
 * Creates:
 * - docs/excels/IELTS-Reading-Sample.xlsx
 * - docs/excels/IELTS-Listening-Sample.xlsx
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Ensure directories exist
const excelDir = path.join(__dirname, '..', 'docs', 'excels');
if (!fs.existsSync(excelDir)) {
  fs.mkdirSync(excelDir, { recursive: true });
}

// ============================================
// READING TEST SAMPLE
// ============================================

const readingWorkbook = XLSX.utils.book_new();

// Sheet 1: TEST_INFO
const testInfo = [
  {
    test_id: 'ielts-reading-sample-01',
    title: 'IELTS Academic Reading - Sample Test',
    skill: 'Reading',
    source: 'IELTS9s Sample',
    attempts: 0
  }
];
XLSX.utils.book_append_sheet(readingWorkbook, XLSX.utils.json_to_sheet(testInfo), 'TEST_INFO');

// Sheet 2: PARTS
const parts = [
  {
    part_id: 'sample-p1',
    part_number: 1,
    title: 'THE IMPORTANCE OF SLEEP',
    passage_html_file: 'passages/sample_sleep.html',
    audio_url: '',
    instructions: ''
  }
];
XLSX.utils.book_append_sheet(readingWorkbook, XLSX.utils.json_to_sheet(parts), 'PARTS');

// Sheet 3: QUESTION_GROUPS
const questionGroups = [
  {
    part_id: 'sample-p1',
    group_id: 'sample-g1',
    group_type: 'Note Completion',
    range: '1-5',
    instructions: 'Complete the notes below. Choose ONE WORD ONLY from the passage for each answer.',
    template_file: 'templates/sample_sleep_template.html',
    render_type: '',
    input_type: ''
  },
  {
    part_id: 'sample-p1',
    group_id: 'sample-g2',
    group_type: 'True - False - Not Given',
    range: '6-10',
    instructions: 'Do the following statements agree with the information given in the passage?',
    template_file: '',
    render_type: '',
    input_type: ''
  }
];
XLSX.utils.book_append_sheet(readingWorkbook, XLSX.utils.json_to_sheet(questionGroups), 'QUESTION_GROUPS');

// Sheet 4: QUESTIONS
const questions = [
  // Note Completion - no text needed
  { group_id: 'sample-g1', q_id: 1, q_text: '', option_a: '', option_b: '', option_c: '', option_d: '', option_e: '', option_f: '', option_g: '' },
  { group_id: 'sample-g1', q_id: 2, q_text: '', option_a: '', option_b: '', option_c: '', option_d: '', option_e: '', option_f: '', option_g: '' },
  { group_id: 'sample-g1', q_id: 3, q_text: '', option_a: '', option_b: '', option_c: '', option_d: '', option_e: '', option_f: '', option_g: '' },
  { group_id: 'sample-g1', q_id: 4, q_text: '', option_a: '', option_b: '', option_c: '', option_d: '', option_e: '', option_f: '', option_g: '' },
  { group_id: 'sample-g1', q_id: 5, q_text: '', option_a: '', option_b: '', option_c: '', option_d: '', option_e: '', option_f: '', option_g: '' },

  // True/False/Not Given
  { group_id: 'sample-g2', q_id: 6, q_text: 'Most adults need 8 hours of sleep per night.', option_a: 'TRUE', option_b: 'FALSE', option_c: 'NOT GIVEN', option_d: '', option_e: '', option_f: '', option_g: '' },
  { group_id: 'sample-g2', q_id: 7, q_text: 'Sleep deprivation affects memory and cognitive function.', option_a: 'TRUE', option_b: 'FALSE', option_c: 'NOT GIVEN', option_d: '', option_e: '', option_f: '', option_g: '' },
  { group_id: 'sample-g2', q_id: 8, q_text: 'Caffeine should be avoided 4 hours before bedtime.', option_a: 'TRUE', option_b: 'FALSE', option_c: 'NOT GIVEN', option_d: '', option_e: '', option_f: '', option_g: '' },
  { group_id: 'sample-g2', q_id: 9, q_text: 'Children require more sleep than adults.', option_a: 'TRUE', option_b: 'FALSE', option_c: 'NOT GIVEN', option_d: '', option_e: '', option_f: '', option_g: '' },
  { group_id: 'sample-g2', q_id: 10, q_text: 'Regular exercise improves sleep quality.', option_a: 'TRUE', option_b: 'FALSE', option_c: 'NOT GIVEN', option_d: '', option_e: '', option_f: '', option_g: '' }
];
XLSX.utils.book_append_sheet(readingWorkbook, XLSX.utils.json_to_sheet(questions), 'QUESTIONS');

// Sheet 5: ANSWERS_&_EXPLANATIONS
const answers = [
  { q_id: 1, correct_answer: 'hours', explanation: 'The passage states "Most adults need 7-9 hours of sleep"' },
  { q_id: 2, correct_answer: 'brain', explanation: 'Sleep allows the brain to consolidate memories' },
  { q_id: 3, correct_answer: 'circadian', explanation: 'Refers to the body\'s natural sleep-wake cycle' },
  { q_id: 4, correct_answer: 'REM', explanation: 'Rapid Eye Movement sleep is when most dreaming occurs' },
  { q_id: 5, correct_answer: 'melatonin', explanation: 'The hormone that regulates sleep-wake cycles' },
  { q_id: 6, correct_answer: 'TRUE', explanation: 'The passage confirms adults need 7-9 hours, with 8 being average' },
  { q_id: 7, correct_answer: 'TRUE', explanation: 'Sleep deprivation is clearly linked to memory and cognitive problems' },
  { q_id: 8, correct_answer: 'TRUE', explanation: 'Caffeine should be avoided for 4-6 hours before sleep' },
  { q_id: 9, correct_answer: 'TRUE', explanation: 'Children and teenagers need 8-10 hours, more than adults' },
  { q_id: 10, correct_answer: 'TRUE', explanation: 'Regular exercise is proven to improve sleep quality and duration' }
];
XLSX.utils.book_append_sheet(readingWorkbook, XLSX.utils.json_to_sheet(answers), 'ANSWERS_&_EXPLANATIONS');

// Save Reading Excel
const readingPath = path.join(excelDir, 'IELTS-Reading-Sample.xlsx');
XLSX.writeFile(readingWorkbook, readingPath);
console.log(`✅ Created: ${readingPath}`);

// ============================================
// LISTENING TEST SAMPLE
// ============================================

const listeningWorkbook = XLSX.utils.book_new();

// Sheet 1: TEST_INFO
const listeningTestInfo = [
  {
    test_id: 'ielts-listening-sample-01',
    title: 'IELTS Academic Listening - Sample Test',
    skill: 'Listening',
    source: 'IELTS9s Sample',
    attempts: 0
  }
];
XLSX.utils.book_append_sheet(listeningWorkbook, XLSX.utils.json_to_sheet(listeningTestInfo), 'TEST_INFO');

// Sheet 2: PARTS
const listeningParts = [
  {
    part_id: 'sample-l1',
    part_number: 1,
    title: 'SECTION 1',
    passage_html_file: 'instructions/sample_section1.html',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    instructions: ''
  }
];
XLSX.utils.book_append_sheet(listeningWorkbook, XLSX.utils.json_to_sheet(listeningParts), 'PARTS');

// Sheet 3: QUESTION_GROUPS
const listeningGroups = [
  {
    part_id: 'sample-l1',
    group_id: 'sample-l1-g1',
    group_type: 'Form Completion',
    range: '1-4',
    instructions: 'Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
    template_file: 'templates/sample_form.html',
    render_type: '',
    input_type: ''
  },
  {
    part_id: 'sample-l1',
    group_id: 'sample-l1-g2',
    group_type: 'Multiple Choice',
    range: '5-7',
    instructions: 'Choose the correct letter, A, B or C.',
    template_file: '',
    render_type: '',
    input_type: ''
  }
];
XLSX.utils.book_append_sheet(listeningWorkbook, XLSX.utils.json_to_sheet(listeningGroups), 'QUESTION_GROUPS');

// Sheet 4: QUESTIONS
const listeningQuestions = [
  // Form Completion
  { group_id: 'sample-l1-g1', q_id: 1, q_text: '', option_a: '', option_b: '', option_c: '', option_d: '', option_e: '', option_f: '', option_g: '' },
  { group_id: 'sample-l1-g1', q_id: 2, q_text: '', option_a: '', option_b: '', option_c: '', option_d: '', option_e: '', option_f: '', option_g: '' },
  { group_id: 'sample-l1-g1', q_id: 3, q_text: '', option_a: '', option_b: '', option_c: '', option_d: '', option_e: '', option_f: '', option_g: '' },
  { group_id: 'sample-l1-g1', q_id: 4, q_text: '', option_a: '', option_b: '', option_c: '', option_d: '', option_e: '', option_f: '', option_g: '' },

  // Multiple Choice
  { group_id: 'sample-l1-g2', q_id: 5, q_text: 'What is the purpose of the accommodation visit?', option_a: 'A. To register for a course', option_b: 'B. To find suitable housing', option_c: 'C. To meet the landlord', option_d: '', option_e: '', option_f: '', option_g: '' },
  { group_id: 'sample-l1-g2', q_id: 6, q_text: 'What is the student\'s budget for accommodation?', option_a: 'A. £100 per week', option_b: 'B. £150 per week', option_c: 'C. £200 per week', option_d: '', option_e: '', option_f: '', option_g: '' },
  { group_id: 'sample-l1-g2', q_id: 7, q_text: 'Which facility is most important to the student?', option_a: 'A. A private bathroom', option_b: 'B. A shared kitchen', option_c: 'C. A study desk', option_d: '', option_e: '', option_f: '', option_g: '' }
];
XLSX.utils.book_append_sheet(listeningWorkbook, XLSX.utils.json_to_sheet(listeningQuestions), 'QUESTIONS');

// Sheet 5: ANSWERS
const listeningAnswers = [
  { q_id: 1, correct_answer: 'John Smith', explanation: 'The speaker says his name is John Smith' },
  { q_id: 2, correct_answer: '15 June', explanation: 'The start date mentioned is 15 June' },
  { q_id: 3, correct_answer: '6 months', explanation: 'The speaker states he will stay for 6 months' },
  { q_id: 4, correct_answer: 'Business', explanation: 'He is studying a Business course' },
  { q_id: 5, correct_answer: 'B', explanation: 'The speaker is looking for suitable housing' },
  { q_id: 6, correct_answer: 'B', explanation: 'His budget is £150 per week' },
  { q_id: 7, correct_answer: 'C', explanation: 'A study desk is most important for his studies' }
];
XLSX.utils.book_append_sheet(listeningWorkbook, XLSX.utils.json_to_sheet(listeningAnswers), 'ANSWERS_&_EXPLANATIONS');

// Save Listening Excel
const listeningPath = path.join(excelDir, 'IELTS-Listening-Sample.xlsx');
XLSX.writeFile(listeningWorkbook, listeningPath);
console.log(`✅ Created: ${listeningPath}`);

console.log('\n📊 Sample Excel files generated!');
console.log('\nNext steps:');
console.log('1. Create HTML files:');
console.log('   - docs/passages/sample_sleep.html');
console.log('   - docs/templates/sample_sleep_template.html');
console.log('   - docs/instructions/sample_section1.html');
console.log('   - docs/templates/sample_form.html');
console.log('\n2. Run conversion:');
console.log('   node scripts/excel-to-json.js docs/excels/IELTS-Reading-Sample.xlsx');
console.log('   node scripts/excel-to-json.js docs/excels/IELTS-Listening-Sample.xlsx');
