#!/usr/bin/env node

/**
 * Convert flat Excel to SIMPLIFIED JSON (content only)
 * Metadata (id, title, skill, source) stays in DB
 * JSON contains only: parts, answerKey, explanations
 *
 * Usage: node scripts/convert-flat-excel-simplified.js <excel-file>
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function readExcelFile(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
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

  // SIMPLIFIED: Only content, no metadata
  let test = {
    parts: [],
    answerKey: {},
    explanations: {}
  };

  // Extract metadata for reference (but don't include in JSON)
  let testMetadata = {
    id: '',
    title: '',
    skill: '',
    source: ''
  };

  let currentPart = null;
  let currentGroup = null;

  // Parse flat rows
  rows.forEach((row) => {
    const section = row.section?.trim() || '';

    if (!section) return; // Skip blank rows

    // Capture metadata (for info only, not in JSON)
    if (section === 'TEST_METADATA') {
      testMetadata.id = row.test_id?.trim() || '';
      testMetadata.title = row.title?.trim() || '';
      testMetadata.skill = row.skill?.trim() || '';
      testMetadata.source = row.source?.trim() || '';
    }

    if (section === 'PART') {
      currentPart = {
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

      test.parts.push(currentPart);
    }

    if (section === 'QUESTION_GROUP') {
      currentGroup = {
        id: row.group_id?.trim() || '',
        type: row.group_type?.trim() || '',
        range: row.group_range?.trim() || '',
        instructions: row.group_instructions?.trim() || '',
        questions: []
      };

      if (row.template_html && row.template_html.trim()) {
        currentGroup.template = row.template_html.trim();
      }

      if (currentPart) {
        currentPart.questionGroups.push(currentGroup);
      }
    }

    if (section === 'QUESTIONS') {
      const qId = row.q_id;
      const question = { id: qId };

      // Add text if present
      if (row.q_text && row.q_text.trim()) {
        question.text = row.q_text.trim();
      }

      // Build options
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

      if (currentGroup) {
        currentGroup.questions.push(question);
      }

      // Store answers & explanations
      if (row.answer !== undefined && row.answer !== '') {
        test.answerKey[qId] = row.answer.toString().trim();
      }

      if (row.explanation && row.explanation.trim()) {
        test.explanations[qId] = row.explanation.trim();
      }
    }
  });

  // Validation
  if (test.parts.length === 0) {
    console.warn('⚠️  No parts found. Check PART section.');
  }

  if (Object.keys(test.answerKey).length === 0) {
    console.warn('⚠️  No answers found. Check QUESTIONS section.');
  }

  // Generate filename from test metadata
  const filename = generateFilename(testMetadata);
  const outputPath = path.join(__dirname, '..', 'src', 'assets', 'data', filename);

  // Save JSON
  fs.writeFileSync(outputPath, JSON.stringify(test, null, 2));

  console.log(`\n✅ JSON saved to: ${outputPath}`);
  console.log(`\n📊 Metadata (store in DB):`);
  console.log(`   ID: ${testMetadata.id}`);
  console.log(`   Title: ${testMetadata.title}`);
  console.log(`   Skill: ${testMetadata.skill}`);
  console.log(`   Source: ${testMetadata.source}`);
  console.log(`\n📋 Content (in JSON):`);
  console.log(`   Parts: ${test.parts.length}`);
  console.log(`   Questions: ${Object.keys(test.answerKey).length}`);
  console.log(`\n💾 DB Record:`);
  console.log(`   {`);
  console.log(`     test_id: "${testMetadata.id}",`);
  console.log(`     title: "${testMetadata.title}",`);
  console.log(`     skill: "${testMetadata.skill}",`);
  console.log(`     source: "${testMetadata.source}",`);
  console.log(`     link: "https://cdn.example.com/${filename}"`);
  console.log(`   }`);
  console.log(`\n✨ Ready to upload to Storage!`);
}

function generateFilename(metadata) {
  const skillMap = {
    Reading: 'reading',
    Listening: 'listening'
  };
  const skill = skillMap[metadata.skill] || 'test';
  const id = metadata.id
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-');
  return `${skill}-${id}.json`;
}

// Main
const excelPath = process.argv[2];

if (!excelPath) {
  console.log('Usage: node scripts/convert-flat-excel-simplified.js <excel-file>');
  console.log('');
  console.log('Creates simplified JSON (content only) for Storage upload');
  console.log('Metadata stays in Database');
  process.exit(1);
}

convertFlatExcelToJson(excelPath);
