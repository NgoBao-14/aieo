#!/usr/bin/env node

/**
 * Create single flat Excel sheet for test input
 * One sheet, all data, human-friendly
 * Usage: node scripts/create-flat-excel-template.js
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelDir = path.join(__dirname, '..', 'docs', 'excels');
if (!fs.existsSync(excelDir)) {
  fs.mkdirSync(excelDir, { recursive: true });
}

console.log('📝 Creating flat single-sheet Excel template...\n');

// ============================================
// FLAT READING TEMPLATE
// ============================================

const readingData = [
  // Section: TEST INFO
  {
    section: 'TEST_INFO',
    test_id: 'ielts-reading-01',
    title: 'IELTS Academic Reading - Test 1',
    skill: 'Reading',
    source: 'IELTS9s Original',
    attempts: 0
  },
  { section: '' }, // Blank separator

  // Section: PART 1
  {
    section: 'PART',
    part_id: 'p1',
    part_number: 1,
    part_title: 'THE STORY OF SILK',
    passage_html: '<div class="passage"><p>Silk is a fine, strong...</p></div>',
    audio_url: ''
  },
  { section: '' }, // Blank separator

  // Section: QUESTION GROUP 1
  {
    section: 'QUESTION_GROUP',
    group_id: 'g1',
    group_type: 'Note Completion',
    range: '1-5',
    instructions: 'Complete the notes. Choose ONE WORD ONLY from passage.',
    template_html: '<h3>Early History</h3><ul><li>Discovered ((1))</li><li>Developed ((2))</li></ul>'
  },
  { section: '' }, // Blank separator

  // Section: QUESTIONS GROUP 1
  {
    section: 'QUESTIONS',
    q_id: 1,
    q_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    option_e: '',
    answer: 'tea',
    explanation: 'She picked tea from her cup when cocoon fell in'
  },
  {
    section: 'QUESTIONS',
    q_id: 2,
    answer: 'reel',
    explanation: 'She developed the silk reel and loom'
  },
  {
    section: 'QUESTIONS',
    q_id: 3,
    answer: 'women',
    explanation: 'Only women were entrusted with tasks'
  },
  {
    section: 'QUESTIONS',
    q_id: 4,
    answer: 'royalty',
    explanation: 'Only members of royalty allowed to wear silk'
  },
  {
    section: 'QUESTIONS',
    q_id: 5,
    answer: 'currency',
    explanation: 'Silk was used as currency to pay taxes'
  },
  { section: '' }, // Blank separator

  // Section: QUESTION GROUP 2
  {
    section: 'QUESTION_GROUP',
    group_id: 'g2',
    group_type: 'True - False - Not Given',
    range: '6-10',
    instructions: 'Do statements agree with passage information?',
    template_html: ''
  },
  { section: '' }, // Blank separator

  // Section: QUESTIONS GROUP 2
  {
    section: 'QUESTIONS',
    q_id: 6,
    q_text: 'The Chinese penalty for revealing the secret of silk was execution.',
    option_a: 'TRUE',
    option_b: 'FALSE',
    option_c: 'NOT GIVEN',
    answer: 'TRUE',
    explanation: 'Anyone caught smuggling was punished by death'
  },
  {
    section: 'QUESTIONS',
    q_id: 7,
    q_text: 'Gold was the most valuable material transported along the Silk Road.',
    option_a: 'TRUE',
    option_b: 'FALSE',
    option_c: 'NOT GIVEN',
    answer: 'FALSE',
    explanation: 'Wool and precious metals were mentioned, not gold'
  },
  {
    section: 'QUESTIONS',
    q_id: 8,
    q_text: 'Roman women wore more silk than Roman men.',
    option_a: 'TRUE',
    option_b: 'FALSE',
    option_c: 'NOT GIVEN',
    answer: 'NOT GIVEN',
    explanation: 'Passage does not mention gender differences in silk wearing'
  },
  {
    section: 'QUESTIONS',
    q_id: 9,
    q_text: 'The monks who took silk to Constantinople were sent by Emperor Justinian I.',
    option_a: 'TRUE',
    option_b: 'FALSE',
    option_c: 'NOT GIVEN',
    answer: 'TRUE',
    explanation: 'Emperor Justinian I sent them as spies'
  },
  {
    section: 'QUESTIONS',
    q_id: 10,
    q_text: 'Natural silk is still used today in medical applications.',
    option_a: 'TRUE',
    option_b: 'FALSE',
    option_c: 'NOT GIVEN',
    answer: 'TRUE',
    explanation: 'Mentioned that natural silk is preferred for medical applications'
  }
];

const readingWB = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(
  readingWB,
  XLSX.utils.json_to_sheet(readingData),
  'Reading Test'
);

const readingPath = path.join(excelDir, 'FLAT-Reading-Template.xlsx');
XLSX.writeFile(readingWB, readingPath);
console.log(`✅ ${readingPath}`);

// ============================================
// FLAT LISTENING TEMPLATE
// ============================================

const listeningData = [
  // Section: TEST INFO
  {
    section: 'TEST_INFO',
    test_id: 'ielts-listening-01',
    title: 'IELTS Academic Listening - Test 1',
    skill: 'Listening',
    source: 'IELTS9s Original',
    attempts: 0
  },
  { section: '' },

  // Section: PART 1
  {
    section: 'PART',
    part_id: 'l1',
    part_number: 1,
    part_title: 'SECTION 1',
    passage_html: '<p>You will hear a student talking to accommodation officer.</p>',
    audio_url: 'https://example.com/audio/section_1.mp3'
  },
  { section: '' },

  // Section: QUESTION GROUP 1
  {
    section: 'QUESTION_GROUP',
    group_id: 'l1g1',
    group_type: 'Form Completion',
    range: '1-4',
    instructions: 'Complete the form. Write NO MORE THAN TWO WORDS AND/OR A NUMBER.',
    template_html: '<h3>Accommodation Form</h3><p>Name: ((1))</p><p>Date: ((2))</p><p>Duration: ((3))</p><p>Course: ((4))</p>'
  },
  { section: '' },

  // Section: QUESTIONS GROUP 1
  {
    section: 'QUESTIONS',
    q_id: 1,
    answer: 'John Smith',
    explanation: 'The speaker introduces himself as John Smith'
  },
  {
    section: 'QUESTIONS',
    q_id: 2,
    answer: '15 June',
    explanation: 'Start date mentioned is 15 June'
  },
  {
    section: 'QUESTIONS',
    q_id: 3,
    answer: '6 months',
    explanation: 'Student will stay for 6 months'
  },
  {
    section: 'QUESTIONS',
    q_id: 4,
    answer: 'Business',
    explanation: 'He is studying Business course'
  },
  { section: '' },

  // Section: QUESTION GROUP 2
  {
    section: 'QUESTION_GROUP',
    group_id: 'l1g2',
    group_type: 'Multiple Choice',
    range: '5-7',
    instructions: 'Choose the correct letter, A, B or C.',
    template_html: ''
  },
  { section: '' },

  // Section: QUESTIONS GROUP 2
  {
    section: 'QUESTIONS',
    q_id: 5,
    q_text: 'What type of accommodation does the student prefer?',
    option_a: 'A. Single room in hall',
    option_b: 'B. Shared room in hall',
    option_c: 'C. Homestay with family',
    answer: 'B',
    explanation: 'Student prefers shared room in hall of residence'
  },
  {
    section: 'QUESTIONS',
    q_id: 6,
    q_text: 'What is the student\'s maximum budget for rent?',
    option_a: 'A. £100 per week',
    option_b: 'B. £150 per week',
    option_c: 'C. £200 per week',
    answer: 'B',
    explanation: 'Budget is £150 per week'
  },
  {
    section: 'QUESTIONS',
    q_id: 7,
    q_text: 'Which facility is most important to the student?',
    option_a: 'A. Private bathroom',
    option_b: 'B. Shared kitchen',
    option_c: 'C. Study desk',
    answer: 'C',
    explanation: 'Study desk is most important for his studies'
  }
];

const listeningWB = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(
  listeningWB,
  XLSX.utils.json_to_sheet(listeningData),
  'Listening Test'
);

const listeningPath = path.join(excelDir, 'FLAT-Listening-Template.xlsx');
XLSX.writeFile(listeningWB, listeningPath);
console.log(`✅ ${listeningPath}`);

console.log('\n✨ Flat templates created!');
console.log('\n📋 Usage:');
console.log('1. Open FLAT-Reading-Template.xlsx or FLAT-Listening-Template.xlsx');
console.log('2. Edit the data (passages, templates, questions, answers)');
console.log('3. Save as: docs/excels/My-Test.xlsx');
console.log('4. Run: node scripts/convert-flat-excel.js docs/excels/My-Test.xlsx');
console.log('5. JSON auto-created in src/assets/data/');
console.log('\n📚 Columns:');
console.log('- section: TEST_INFO | PART | QUESTION_GROUP | QUESTIONS');
console.log('- q_id: Question number');
console.log('- q_text: Question text (or leave blank for template-based)');
console.log('- option_a-e: Options for multiple choice');
console.log('- answer: Correct answer');
console.log('- explanation: Why this is correct');
console.log('- passage_html: Full HTML content');
console.log('- template_html: HTML with ((1)) placeholders');
