#!/usr/bin/env node

/**
 * Convert flat Excel sheet to JSON
 * One sheet → one JSON test file
 * Usage: node scripts/convert-flat-excel.js <excel-file>
 *
 * Example:
 * node scripts/convert-flat-excel.js docs/excels/My-Reading-Test.xlsx
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function readExcelFile(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // First sheet
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    return sheet;
  } catch (error) {
    console.error(`❌ Error reading Excel: ${error.message}`);
    process.exit(1);
  }
}

function convertFlatExcelToJson(excelPath) {
  console.log(`📂 Reading Excel file: ${excelPath}`);

  const rows = readExcelFile(excelPath);

  // Initialize test object
  let test = {
    id: '',
    title: '',
    skill: '',
    source: '',
    attempts: 0,
    parts: [],
    answerKey: {},
    explanations: {}
  };

  let currentPart = null;
  let currentGroup = null;
  const partMap = {}; // Track parts by id

  // Parse flat rows
  rows.forEach((row, index) => {
    const section = row.section?.trim() || '';

    if (!section) return; // Skip blank rows

    if (section === 'TEST_INFO') {
      test.id = row.test_id?.trim() || '';
      test.title = row.title?.trim() || '';
      test.skill = row.skill?.trim() || '';
      test.source = row.source?.trim() || 'IELTS9s';
      test.attempts = row.attempts || 0;
    }

    if (section === 'PART') {
      const partId = row.part_id?.trim() || `p${row.part_number}`;
      currentPart = {
        id: partId,
        number: row.part_number || 1,
        title: row.part_title?.trim() || '',
        questionGroups: []
      };

      if (row.passage_html && row.passage_html.trim()) {
        currentPart.passageHtml = row.passage_html.trim();
      }

      if (row.audio_url && row.audio_url.trim()) {
        currentPart.audioUrl = row.audio_url.trim();
      }

      partMap[currentPart.id] = currentPart;
      test.parts.push(currentPart);
    }

    if (section === 'QUESTION_GROUP') {
      const groupId = row.group_id?.trim() || '';
      const groupType = row.group_type?.trim() || '';

      currentGroup = {
        id: groupId,
        type: groupType,
        range: row.range?.trim() || '',
        instructions: row.instructions?.trim() || '',
        questions: []
      };

      if (row.template_html && row.template_html.trim()) {
        currentGroup.template = row.template_html.trim();
      }

      // Add question types to current part
      if (currentPart && !currentPart.questionTypes) {
        currentPart.questionTypes = [];
      }
      if (currentPart && !currentPart.questionTypes.includes(groupType)) {
        currentPart.questionTypes.push(groupType);
      }

      if (currentPart) {
        currentPart.questionGroups.push(currentGroup);
      }
    }

    if (section === 'QUESTIONS') {
      const qId = row.q_id;
      const question = {
        id: qId
      };

      // Add text if present
      if (row.q_text && row.q_text.trim()) {
        question.text = row.q_text.trim();
      }

      // Build options array
      const options = [];
      const optionFields = ['option_a', 'option_b', 'option_c', 'option_d', 'option_e'];

      for (const field of optionFields) {
        if (row[field] && row[field].toString().trim()) {
          options.push(row[field].toString().trim());
        }
      }

      if (options.length > 0) {
        question.options = options;
      }

      // Add to current group
      if (currentGroup) {
        currentGroup.questions.push(question);
      }

      // Add answer
      if (row.answer !== undefined && row.answer !== '') {
        test.answerKey[qId] = row.answer.toString().trim();
      }

      // Add explanation
      if (row.explanation && row.explanation.trim()) {
        test.explanations[qId] = row.explanation.trim();
      }
    }
  });

  // Validation
  if (!test.id) {
    console.error('❌ No test_id found. Check TEST_INFO section.');
    process.exit(1);
  }

  if (test.parts.length === 0) {
    console.warn('⚠️  No parts found. Check PART section.');
  }

  if (Object.keys(test.answerKey).length === 0) {
    console.warn('⚠️  No answers found. Check QUESTIONS section.');
  }

  // Output
  const output = [test];
  const outputPath = generateOutputPath(test.skill);

  // Merge with existing if file exists
  if (fs.existsSync(outputPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      if (Array.isArray(existing)) {
        const existingIndex = existing.findIndex(t => t.id === test.id);
        if (existingIndex >= 0) {
          console.log(`🔄 Updating existing test: ${test.id}`);
          existing[existingIndex] = test;
        } else {
          console.log(`➕ Adding new test to existing file`);
          existing.push(test);
        }
        output = existing;
      }
    } catch (e) {
      console.warn('⚠️  Could not parse existing JSON, creating new file');
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`✅ JSON saved to: ${outputPath}`);
  console.log(`📊 Test: ${test.title}`);
  console.log(`📖 Parts: ${test.parts.length}`);
  console.log(`❓ Questions: ${Object.keys(test.answerKey).length}`);
  console.log(`\n✨ Done! Test is now available in the app.`);
}

function generateOutputPath(skill) {
  if (skill === 'Reading') {
    return path.join(__dirname, '..', 'src', 'assets', 'data', 'reading-tests.json');
  } else if (skill === 'Listening') {
    return path.join(__dirname, '..', 'src', 'assets', 'data', 'listening-tests.json');
  }
  return path.join(__dirname, '..', 'src', 'assets', 'data', 'tests.json');
}

// Main
const excelPath = process.argv[2];

if (!excelPath) {
  console.log('Usage: node scripts/convert-flat-excel.js <excel-file>');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/convert-flat-excel.js docs/excels/My-Reading.xlsx');
  console.log('  node scripts/convert-flat-excel.js docs/excels/My-Listening.xlsx');
  process.exit(1);
}

convertFlatExcelToJson(excelPath);
