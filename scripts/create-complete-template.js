#!/usr/bin/env node

/**
 * Create COMPLETE Excel template with full Reading test
 * Ready to upload immediately
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelDir = path.join(__dirname, '..', 'docs', 'excels');
if (!fs.existsSync(excelDir)) {
  fs.mkdirSync(excelDir, { recursive: true });
}

console.log('📝 Creating complete Excel template...\n');

const completeData = [
  // ===== TEST METADATA =====
  {
    section: 'TEST_METADATA',
    test_id: 'ielts-reading-01',
    title: 'IELTS Academic Reading - Practice Test 1',
    skill: 'Reading',
    source: 'IELTS9s Original',
    duration_minutes: 60,
    total_questions: 13
  },
  { section: '' },

  // ===== PART 1 =====
  {
    section: 'PART',
    part_number: 1,
    part_title: 'THE STORY OF SILK',
    passage_html: `<div class='passage'>
<p><strong>Paragraph A</strong></p>
<p>Silk is a fine, strong, soft lustrous fibre produced by silkworms in making cocoons and collected to make thread and fabric. According to legend, it was Lei Zu (also known as Hsi-Ling-Shih), the wife of the mythical Yellow Emperor, who discovered the process around 3000 BC. She was supposedly sitting under a mulberry tree when a cocoon fell into her <strong>tea</strong>, and as she picked it out, a long thread began to unravel. She became so fascinated that she took to studying the silkworm. She also developed the silk <strong>reel</strong> and loom. The art of raising silkworms is called sericulture.</p>

<p><strong>Paragraph B</strong></p>
<p>For about 3,000 years, the Chinese kept the secret of silk entirely to themselves. It was the most zealously guarded secret in history. Anyone caught smuggling silkworm eggs or cocoons out of China was punished by death. Only <strong>women</strong> were entrusted with the labourious tasks of raising the silkworms and weaving the fabric. Only members of <strong>royalty</strong> were allowed to wear silk garments. The fabric was so prized that it was used as a form of <strong>currency</strong> — farmers paid their taxes in silk, and the Emperor rewarded his ministers with silk.</p>

<p><strong>Paragraph C</strong></p>
<p>Silk was used for many purposes beyond clothing. Evidence found near Changsha, China showed that <strong>paper</strong> was made from silk as early as 168 AD. Silk was used for musical instruments, fishing lines, bowstrings, and even <strong>money</strong>. The Chinese also made luxury items from silk, including fans, wall hangings, and paintings.</p>

<p><strong>Paragraph D</strong></p>
<p>The Silk Road — the ancient network of trade routes linking China to the Mediterranean — got its name because silk was the major commodity carried westward. Merchants would bring silk to the west and take back <strong>wool</strong>, gold, and precious metals to China. By the first century BC, the Romans had developed a passion for silk. Wealthy Romans wore it to show off their riches. Silk was literally worth its weight in gold.</p>

<p><strong>Paragraph E</strong></p>
<p>The secret of silk finally left China around 550 AD when, according to the Byzantine historian Procopius, two <strong>monks</strong> succeeded in smuggling silkworm eggs out of China. The Emperor Justinian I had sent them to China as spies. They hid silkworm eggs inside hollow bamboo <strong>canes</strong> and brought them to Constantinople. This marked the beginning of the silk industry in the Western world.</p>

<p><strong>Paragraph F</strong></p>
<p>The invention of artificial fibres like <strong>nylon</strong> in the 20th century led to a decline in natural silk production. However, silk remains a luxury item globally and continues to be highly valued. China remains the world's leading producer of silk, followed by India. The global silk industry is worth billions of dollars annually, and natural silk is still preferred for high-end fashion and medical applications.</p>
</div>`,
    audio_url: ''
  },
  { section: '' },

  // ===== QUESTION GROUP 1: Note Completion =====
  {
    section: 'QUESTION_GROUP',
    group_id: 'g1',
    group_type: 'Note Completion',
    group_range: '1-8',
    group_instructions: 'Complete the notes below. Choose ONE WORD ONLY from the passage for each answer.',
    template_html: `<h3>Early silk production in China</h3>
<ul>
<li>Around 3000 BC — Emperor's wife discovered silk when cocoon fell into her ((1))</li>
<li>She developed the silk ((2)) and loom</li>
<li>Only ((3)) were permitted to raise silkworms and weave fabric</li>
<li>Only ((4)) were allowed to wear silk garments</li>
<li>Silk used as form of ((5)) — farmers paid taxes in silk</li>
<li>Evidence found that ((6)) was made from silk by 168 AD</li>
</ul>
<h3>Silk reaches the rest of the world</h3>
<ul>
<li>Merchants took silk westward and returned with ((7)) and precious metals</li>
<li>Around 550 AD — two ((8)) smuggled silkworm eggs to Constantinople in bamboo canes</li>
</ul>`
  },
  { section: '' },

  // Questions for Group 1
  { section: 'QUESTIONS', q_id: 1, q_text: '', option_a: '', option_b: '', option_c: '', option_d: '', option_e: '', answer: 'tea', explanation: 'She picked tea from her cup when cocoon fell in' },
  { section: 'QUESTIONS', q_id: 2, q_text: '', answer: 'reel', explanation: 'She developed the silk reel and loom' },
  { section: 'QUESTIONS', q_id: 3, q_text: '', answer: 'women', explanation: 'Only women were entrusted with raising silkworms' },
  { section: 'QUESTIONS', q_id: 4, q_text: '', answer: 'royalty', explanation: 'Only members of royalty allowed to wear silk' },
  { section: 'QUESTIONS', q_id: 5, q_text: '', answer: 'currency', explanation: 'Silk was used as currency to pay taxes' },
  { section: 'QUESTIONS', q_id: 6, q_text: '', answer: 'paper', explanation: 'Evidence found that paper was made from silk' },
  { section: 'QUESTIONS', q_id: 7, q_text: '', answer: 'wool', explanation: 'Merchants returned with wool and precious metals' },
  { section: 'QUESTIONS', q_id: 8, q_text: '', answer: 'monks', explanation: 'Two monks smuggled silkworm eggs to Constantinople' },
  { section: '' },

  // ===== QUESTION GROUP 2: True/False/Not Given =====
  {
    section: 'QUESTION_GROUP',
    group_id: 'g2',
    group_type: 'True - False - Not Given',
    group_range: '9-13',
    group_instructions: 'Do the following statements agree with the information given in the passage?',
    template_html: ''
  },
  { section: '' },

  // Questions for Group 2
  { section: 'QUESTIONS', q_id: 9, q_text: 'The Chinese penalty for revealing the secret of silk was execution.', option_a: 'TRUE', option_b: 'FALSE', option_c: 'NOT GIVEN', answer: 'TRUE', explanation: 'Anyone caught smuggling was punished by death' },
  { section: 'QUESTIONS', q_id: 10, q_text: 'Gold was the most valuable material transported along the Silk Road.', option_a: 'TRUE', option_b: 'FALSE', option_c: 'NOT GIVEN', answer: 'FALSE', explanation: 'Passage mentions wool and precious metals as main imports' },
  { section: 'QUESTIONS', q_id: 11, q_text: 'Roman women wore more silk than Roman men.', option_a: 'TRUE', option_b: 'FALSE', option_c: 'NOT GIVEN', answer: 'NOT GIVEN', explanation: 'Passage does not mention gender differences' },
  { section: 'QUESTIONS', q_id: 12, q_text: 'The monks who took silk to Constantinople were sent by Emperor Justinian I.', option_a: 'TRUE', option_b: 'FALSE', option_c: 'NOT GIVEN', answer: 'TRUE', explanation: 'Emperor Justinian I sent them as spies' },
  { section: 'QUESTIONS', q_id: 13, q_text: 'Natural silk is still used today in medical applications.', option_a: 'TRUE', option_b: 'FALSE', option_c: 'NOT GIVEN', answer: 'TRUE', explanation: 'Natural silk still preferred for medical applications' }
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(completeData), 'Reading Test');

const filePath = path.join(excelDir, 'TEMPLATE-Reading-Test-01.xlsx');
XLSX.writeFile(wb, filePath);

console.log(`✅ Created: TEMPLATE-Reading-Test-01.xlsx`);
console.log(`\n📊 Contains:`);
console.log(`   - TEST_METADATA (for DB)`);
console.log(`   - PART 1: THE STORY OF SILK (full passage)`);
console.log(`   - QUESTION_GROUP 1: Note Completion (8 questions)`);
console.log(`   - QUESTION_GROUP 2: True/False/Not Given (5 questions)`);
console.log(`   - Total: 13 questions with answers & explanations`);
console.log(`\n🚀 Ready to upload!`);
console.log(`\nUsage:`);
console.log(`  node scripts/upload-and-deploy.js docs/excels/TEMPLATE-Reading-Test-01.xlsx`);
