#!/usr/bin/env node

/**
 * Create blank Excel template for test creation
 * Usage: node scripts/create-blank-template.js
 *
 * Creates:
 * - docs/excels/BLANK-Reading-Template.xlsx
 * - docs/excels/BLANK-Listening-Template.xlsx
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Ensure directories exist
const excelDir = path.join(__dirname, '..', 'docs', 'excels');
if (!fs.existsSync(excelDir)) {
  fs.mkdirSync(excelDir, { recursive: true });
}

console.log('📝 Creating blank Excel templates...\n');

// ============================================
// BLANK READING TEMPLATE
// ============================================

const readingWB = XLSX.utils.book_new();

// TEST_INFO - blank row with headers
const testInfoHeaders = [
  { test_id: '', title: '', skill: 'Reading', source: '', attempts: 0 }
];
XLSX.utils.book_append_sheet(
  readingWB,
  XLSX.utils.json_to_sheet(testInfoHeaders, { header: ['test_id', 'title', 'skill', 'source', 'attempts'] }),
  'TEST_INFO'
);

// PARTS - blank with example
const partsExample = [
  {
    part_id: '',
    part_number: 1,
    title: '',
    passage_html_file: 'passages/passage_1.html',
    audio_url: '',
    instructions: ''
  }
];
XLSX.utils.book_append_sheet(
  readingWB,
  XLSX.utils.json_to_sheet(partsExample),
  'PARTS'
);

// QUESTION_GROUPS - blank with types
const groupsExample = [
  {
    part_id: '',
    group_id: '',
    group_type: 'Note Completion',
    range: '1-8',
    instructions: '',
    template_file: 'templates/template_1.html',
    render_type: '',
    input_type: ''
  },
  {
    part_id: '',
    group_id: '',
    group_type: 'True - False - Not Given',
    range: '9-13',
    instructions: '',
    template_file: '',
    render_type: '',
    input_type: ''
  }
];
XLSX.utils.book_append_sheet(
  readingWB,
  XLSX.utils.json_to_sheet(groupsExample),
  'QUESTION_GROUPS'
);

// QUESTIONS - blank
const questionsBlank = [
  {
    group_id: '',
    q_id: 1,
    q_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    option_e: '',
    option_f: '',
    option_g: ''
  }
];
XLSX.utils.book_append_sheet(
  readingWB,
  XLSX.utils.json_to_sheet(questionsBlank),
  'QUESTIONS'
);

// ANSWERS - blank
const answersBlank = [
  {
    q_id: 1,
    correct_answer: '',
    explanation: ''
  }
];
XLSX.utils.book_append_sheet(
  readingWB,
  XLSX.utils.json_to_sheet(answersBlank),
  'ANSWERS_&_EXPLANATIONS'
);

// Save
const readingPath = path.join(excelDir, 'BLANK-Reading-Template.xlsx');
XLSX.writeFile(readingWB, readingPath);
console.log(`✅ ${readingPath}`);

// ============================================
// BLANK LISTENING TEMPLATE
// ============================================

const listeningWB = XLSX.utils.book_new();

// TEST_INFO
const listeningTestInfo = [
  { test_id: '', title: '', skill: 'Listening', source: '', attempts: 0 }
];
XLSX.utils.book_append_sheet(
  listeningWB,
  XLSX.utils.json_to_sheet(listeningTestInfo),
  'TEST_INFO'
);

// PARTS - with audio URL
const listeningParts = [
  {
    part_id: '',
    part_number: 1,
    title: 'SECTION 1',
    passage_html_file: 'instructions/section_1.html',
    audio_url: 'https://example.com/audio/section_1.mp3',
    instructions: ''
  }
];
XLSX.utils.book_append_sheet(
  listeningWB,
  XLSX.utils.json_to_sheet(listeningParts),
  'PARTS'
);

// QUESTION_GROUPS
const listeningGroups = [
  {
    part_id: '',
    group_id: '',
    group_type: 'Form Completion',
    range: '1-4',
    instructions: '',
    template_file: 'templates/form_1.html',
    render_type: '',
    input_type: ''
  },
  {
    part_id: '',
    group_id: '',
    group_type: 'Multiple Choice',
    range: '5-7',
    instructions: '',
    template_file: '',
    render_type: '',
    input_type: ''
  }
];
XLSX.utils.book_append_sheet(
  listeningWB,
  XLSX.utils.json_to_sheet(listeningGroups),
  'QUESTION_GROUPS'
);

// QUESTIONS
XLSX.utils.book_append_sheet(
  listeningWB,
  XLSX.utils.json_to_sheet(questionsBlank),
  'QUESTIONS'
);

// ANSWERS
XLSX.utils.book_append_sheet(
  listeningWB,
  XLSX.utils.json_to_sheet(answersBlank),
  'ANSWERS_&_EXPLANATIONS'
);

// Save
const listeningPath = path.join(excelDir, 'BLANK-Listening-Template.xlsx');
XLSX.writeFile(listeningWB, listeningPath);
console.log(`✅ ${listeningPath}`);

console.log('\n📋 Instructions:');
console.log('1. Open one of the blank templates');
console.log('2. Fill in your test data');
console.log('3. Create HTML files in docs/passages/, docs/templates/, docs/instructions/');
console.log('4. Run: node scripts/excel-to-json.js <your-file.xlsx>');
console.log('\n📚 Reference: docs/TEST_STRUCTURE_AND_TYPES.md');
