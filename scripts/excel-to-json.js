#!/usr/bin/env node

/**
 * Convert Excel file to JSON format for IELTS tests
 * Usage: node excel-to-json.js <excel-file-path> [output-json-path]
 *
 * Example:
 * node excel-to-json.js docs/excels/IELTS-Reading-Test-01.xlsx
 * node excel-to-json.js docs/excels/IELTS-Listening-Test-01.xlsx src/assets/data/custom-listening.json
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function readExcelFile(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheets = {};

    workbook.SheetNames.forEach(name => {
      sheets[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
    });

    return sheets;
  } catch (error) {
    console.error(`❌ Error reading Excel file: ${error.message}`);
    process.exit(1);
  }
}

function readHtmlFile(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  HTML file not found: ${filePath}`);
      return '';
    }
    return fs.readFileSync(fullPath, 'utf-8');
  } catch (error) {
    console.warn(`⚠️  Error reading HTML file ${filePath}: ${error.message}`);
    return '';
  }
}

function parseQuestionGroupType(typeStr) {
  const type = typeStr?.trim() || '';
  const templates = {
    'Note Completion': { hasTemplate: true, inputType: 'fill' },
    'Form Completion': { hasTemplate: true, inputType: 'fill' },
    'Table Completion': { hasTemplate: true, inputType: 'fill' },
    'Sentence Completion': { hasTemplate: true, inputType: 'fill' },
    'Flow-chart Completion': { hasTemplate: true, inputType: 'fill' },
    'Diagram Labelling': { hasTemplate: true, inputType: 'fill' },
    'Map Labelling': { hasTemplate: true, inputType: 'fill' },
    'True - False - Not Given': { hasTemplate: false, renderType: 'choice' },
    'Matching Information': { hasTemplate: false, renderType: 'grid' },
    'Matching Features': { hasTemplate: false, renderType: 'choice' },
    'Matching Sentence Endings': { hasTemplate: false, renderType: 'choice' },
    'Multiple Choice': { hasTemplate: false, renderType: 'choice' },
    'Multiple Choice (Multiple Answers)': { hasTemplate: false, renderType: 'choice' },
    'Headings Matching': { hasTemplate: false, renderType: 'headings' },
  };
  return templates[type] || { hasTemplate: false, renderType: 'choice' };
}

function buildQuestionGroup(groupData, questionsData, answersData) {
  const {
    part_id,
    group_id,
    group_type,
    range,
    instructions,
    template_file,
    render_type,
    input_type
  } = groupData;

  const typeInfo = parseQuestionGroupType(group_type);
  const template = template_file ? readHtmlFile(template_file) : '';

  // Build questions for this group
  const questionsForGroup = questionsData
    .filter(q => q.group_id === group_id)
    .map(q => {
      const answer = answersData.find(a => String(a.q_id) === String(q.q_id));

      const question = {
        id: parseInt(q.q_id) || q.q_id
      };

      // Add text if present
      if (q.q_text && q.q_text.trim()) {
        question.text = q.q_text.trim();
      }

      // Build options array
      const options = [];
      const optionFields = ['option_a', 'option_b', 'option_c', 'option_d', 'option_e', 'option_f', 'option_g'];

      for (const field of optionFields) {
        if (q[field] && q[field].trim()) {
          options.push(q[field].trim());
        }
      }

      if (options.length > 0) {
        question.options = options;
      }

      return question;
    });

  // Build group object
  const group = {
    id: group_id,
    type: group_type,
    range,
    instructions: instructions?.trim() || '',
    questions: questionsForGroup
  };

  // Add template if present
  if (template) {
    group.template = template;
  }

  // Add render type if specified
  if (render_type && render_type.trim()) {
    group.renderType = render_type.trim();
  }

  // Add input type if specified
  if (input_type && input_type.trim()) {
    group.inputType = input_type.trim();
  }

  return group;
}

function convertExcelToJson(excelPath, outputPath) {
  console.log(`📂 Reading Excel file: ${excelPath}`);

  const sheets = readExcelFile(excelPath);

  // Extract data from sheets
  const testInfo = sheets.TEST_INFO?.[0];
  const partsData = sheets.PARTS || [];
  const groupsData = sheets.QUESTION_GROUPS || [];
  const questionsData = sheets.QUESTIONS || [];
  const answersData = sheets['ANSWERS_&_EXPLANATIONS'] || sheets.ANSWERS || [];

  if (!testInfo) {
    console.error('❌ TEST_INFO sheet not found or empty');
    process.exit(1);
  }

  // Build test object
  const test = {
    id: testInfo.test_id || testInfo['test_id'],
    title: testInfo.title || testInfo['title'],
    skill: testInfo.skill || testInfo['skill'],
    source: testInfo.source || testInfo['source'] || 'IELTS9s',
    attempts: parseInt(testInfo.attempts) || 0,
    parts: [],
    answerKey: {},
    explanations: {}
  };

  // Build parts
  partsData.forEach(partData => {
    const part = {
      id: partData.part_id,
      number: parseInt(partData.part_number),
      title: partData.title,
      questionGroups: []
    };

    // Add passage or audio
    if (partData.passage_html_file && partData.passage_html_file.trim()) {
      const passageHtml = readHtmlFile(partData.passage_html_file);
      if (passageHtml) {
        part.passageHtml = passageHtml;
      }
    }

    if (partData.audio_url && partData.audio_url.trim()) {
      part.audioUrl = partData.audio_url.trim();
    }

    // Get question types for this part
    const partGroups = groupsData.filter(g => g.part_id === partData.part_id);
    part.questionTypes = [...new Set(partGroups.map(g => g.group_type))];

    // Build question groups for this part
    partGroups.forEach(groupData => {
      const group = buildQuestionGroup(groupData, questionsData, answersData);
      part.questionGroups.push(group);
    });

    test.parts.push(part);
  });

  // Build answer key and explanations
  answersData.forEach(answer => {
    const qId = answer.q_id;
    test.answerKey[qId] = answer.correct_answer || '';
    if (answer.explanation) {
      test.explanations[qId] = answer.explanation;
    }
  });

  // Validate
  if (test.parts.length === 0) {
    console.warn('⚠️  No parts found. Check PARTS sheet.');
  }
  if (Object.keys(test.answerKey).length === 0) {
    console.warn('⚠️  No answers found. Check ANSWERS sheet.');
  }

  // Output
  const output = [test];
  const finalPath = outputPath || generateOutputPath(test.skill);

  // If file exists, append to array
  if (fs.existsSync(finalPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(finalPath, 'utf-8'));
      if (Array.isArray(existing)) {
        // Check if test already exists, update it
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

  fs.writeFileSync(finalPath, JSON.stringify(output, null, 2));
  console.log(`✅ JSON saved to: ${finalPath}`);
  console.log(`📊 Test: ${test.title}`);
  console.log(`📖 Parts: ${test.parts.length}`);
  console.log(`❓ Questions: ${Object.keys(test.answerKey).length}`);
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
const outputPath = process.argv[3];

if (!excelPath) {
  console.log('Usage: node excel-to-json.js <excel-file> [output-json]');
  console.log('');
  console.log('Examples:');
  console.log('  node excel-to-json.js docs/excels/Reading-Test-01.xlsx');
  console.log('  node excel-to-json.js docs/excels/Listening-Test-01.xlsx');
  process.exit(1);
}

convertExcelToJson(excelPath, outputPath);
