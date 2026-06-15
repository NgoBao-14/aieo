#!/usr/bin/env node

/**
 * Upload Excel → Convert → Save JSON to Firebase Storage
 * One command to rule them all!
 *
 * Usage: node scripts/upload-and-deploy.js <excel-file>
 *
 * Example:
 * node scripts/upload-and-deploy.js docs/excels/Reading-Test-01.xlsx
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// ============================================
// FIREBASE SETUP
// ============================================

// Initialize Firebase (assuming credentials in environment)
// Set GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json before running
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS))
  : null;

if (!serviceAccount) {
  console.log('⚠️  Firebase credentials not found.');
  console.log('Set: export GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccountKey.json');
  console.log('\nContinuing in LOCAL MODE (JSON only)...\n');
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'YOUR_BUCKET_ID.appspot.com' // Change this!
  });
}

const bucket = serviceAccount ? admin.storage().bucket() : null;

// ============================================
// CONVERSION LOGIC
// ============================================

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

function convertToJson(rows) {
  let test = {
    parts: [],
    answerKey: {},
    explanations: {}
  };

  let testMetadata = {
    id: '',
    title: '',
    skill: '',
    source: ''
  };

  let currentPart = null;
  let currentGroup = null;

  rows.forEach((row) => {
    const section = row.section?.trim() || '';

    if (!section) return;

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

      if (row.q_text && row.q_text.trim()) {
        question.text = row.q_text.trim();
      }

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

      if (row.answer !== undefined && row.answer !== '') {
        test.answerKey[qId] = row.answer.toString().trim();
      }

      if (row.explanation && row.explanation.trim()) {
        test.explanations[qId] = row.explanation.trim();
      }
    }
  });

  return { test, testMetadata };
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

// ============================================
// DEPLOY TO FIREBASE
// ============================================

async function uploadToFirebase(filename, jsonData) {
  if (!bucket) {
    console.log('⚠️  Firebase Storage not connected. Skipping upload.');
    return null;
  }

  try {
    const file = bucket.file(`tests/${filename}`);
    await file.save(JSON.stringify(jsonData, null, 2), {
      metadata: {
        contentType: 'application/json'
      }
    });

    // Make public
    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/tests/${filename}`;
    return publicUrl;
  } catch (error) {
    console.error(`❌ Firebase upload error: ${error.message}`);
    return null;
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  const excelPath = process.argv[2];

  if (!excelPath) {
    console.log('Usage: node scripts/upload-and-deploy.js <excel-file>');
    console.log('Example: node scripts/upload-and-deploy.js docs/excels/Reading-Test-01.xlsx');
    process.exit(1);
  }

  console.log(`📂 Processing: ${excelPath}\n`);

  // Step 1: Read Excel
  const rows = readExcelFile(excelPath);

  // Step 2: Convert to JSON
  const { test, testMetadata } = convertToJson(rows);

  if (test.parts.length === 0) {
    console.error('❌ No parts found in Excel');
    process.exit(1);
  }

  // Step 3: Generate filename
  const filename = generateFilename(testMetadata);
  console.log(`📝 Converted to: ${filename}`);

  // Step 4: Save locally (optional backup)
  const localPath = path.join(__dirname, '..', 'src', 'assets', 'data', filename);
  fs.writeFileSync(localPath, JSON.stringify(test, null, 2));
  console.log(`💾 Saved locally: ${localPath}`);

  // Step 5: Upload to Firebase
  console.log(`\n☁️  Uploading to Firebase Storage...`);
  const publicUrl = await uploadToFirebase(filename, test);

  // Step 6: Display DB record
  console.log(`\n✅ SUCCESS!\n`);
  console.log(`📊 Test Metadata:`);
  console.log(`   ID: ${testMetadata.id}`);
  console.log(`   Title: ${testMetadata.title}`);
  console.log(`   Skill: ${testMetadata.skill}`);
  console.log(`   Source: ${testMetadata.source}`);
  console.log(`\n📋 Content Stats:`);
  console.log(`   Parts: ${test.parts.length}`);
  console.log(`   Total Questions: ${Object.keys(test.answerKey).length}`);

  console.log(`\n📌 DB Record (Save this):`);
  console.log(`{`);
  console.log(`  "test_id": "${testMetadata.id}",`);
  console.log(`  "title": "${testMetadata.title}",`);
  console.log(`  "skill": "${testMetadata.skill}",`);
  console.log(`  "source": "${testMetadata.source}",`);
  console.log(`  "link": "${publicUrl || 'https://storage.googleapis.com/.../tests/' + filename}"`);
  console.log(`}`);

  console.log(`\n🚀 Ready to use in app!`);
}

main().catch(console.error);
