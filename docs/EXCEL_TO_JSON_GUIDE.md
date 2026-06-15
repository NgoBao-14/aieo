# Excel to JSON Conversion Guide

## Quick Start

### Step 1: Prepare Excel File
Create an Excel file with sheets:
- `TEST_INFO` - Test metadata
- `PARTS` - Reading passages or Listening audio
- `QUESTION_GROUPS` - Question types and instructions
- `QUESTIONS` - Individual questions
- `ANSWERS_&_EXPLANATIONS` - Answer keys and explanations

📝 See `EXCEL_STRUCTURE.md` for detailed schema

### Step 2: Prepare HTML Files
- **Reading**: Put passage HTML in `docs/passages/`
- **Listening**: Put instructions HTML in `docs/instructions/`
- **Templates**: Put question templates in `docs/templates/`

Example:
```
docs/
├── passages/
│   └── passage_silk.html
├── instructions/
│   └── section_1.html
└── templates/
    └── template_form.html
```

### Step 3: Run Conversion
```bash
node scripts/excel-to-json.js docs/excels/IELTS-Reading-Test-01.xlsx
node scripts/excel-to-json.js docs/excels/IELTS-Listening-Test-01.xlsx
```

**Output:**
- Reading → `src/assets/data/reading-tests.json`
- Listening → `src/assets/data/listening-tests.json`

### Step 4: (Optional) Custom Output Path
```bash
node scripts/excel-to-json.js docs/excels/My-Test.xlsx src/assets/data/custom.json
```

---

## Example: Reading Test

### Excel File: `IELTS-Reading-Test-01.xlsx`

#### TEST_INFO Sheet
```csv
test_id,title,skill,source,attempts
ielts-reading-full-01,IELTS Academic Reading - Practice Test 1,Reading,IELTS9s Original,1024
```

#### PARTS Sheet
```csv
part_id,part_number,title,passage_html_file,audio_url,instructions
full-01-p1,1,THE STORY OF SILK,passages/passage_silk.html,,
full-01-p2,2,THE PSYCHOLOGY OF PROCRASTINATION,passages/passage_psychology.html,,
```

#### QUESTION_GROUPS Sheet
```csv
part_id,group_id,group_type,range,instructions,template_file,render_type,input_type
full-01-p1,p1-g1,Note Completion,1-8,Complete the notes below...,templates/template_silk.html,,
full-01-p1,p1-g2,True - False - Not Given,9-13,Do the following statements...,,,
full-01-p2,p2-g1,Matching Information,14-16,Which paragraph contains...,,grid,
full-01-p2,p2-g2,Matching Sentence Endings,17-20,Complete each sentence...,templates/template_endings.html,,
```

#### QUESTIONS Sheet
```csv
group_id,q_id,q_text,option_a,option_b,option_c,option_d,option_e,option_f,option_g
p1-g1,1,,,,,,,,
p1-g1,2,,,,,,,,
p1-g2,9,The Chinese penalty for revealing the secret of silk was execution.,TRUE,FALSE,NOT GIVEN,,,
p1-g2,10,Gold was the most valuable material transported along the Silk Road.,TRUE,FALSE,NOT GIVEN,,,
p1-g2,11,Roman women wore more silk than Roman men.,TRUE,FALSE,NOT GIVEN,,,
p2-g1,14,neurological evidence of a link between procrastination and emotion,A,B,C,D,E,F,
```

#### ANSWERS_&_EXPLANATIONS Sheet
```csv
q_id,correct_answer,explanation
1,tea,She picked tea from her cup when a cocoon fell in
2,reel,She developed the silk reel and loom
3,women,Only women were entrusted with raising silkworms
9,TRUE,Anyone caught smuggling was punished by death
10,FALSE,Wool and precious metals were mentioned
11,NOT GIVEN,The passage doesn't mention Roman women vs men
14,B,Paragraph B contains neurological evidence
```

---

## HTML Template Examples

### Reading - Note Completion
**File:** `docs/templates/template_silk.html`
```html
<h3>Early silk production in China</h3>
<ul>
  <li>Around 3000 BC — Emperor's wife discovered silk when a cocoon fell into her ((1))</li>
  <li>She developed the silk ((2)) and loom</li>
  <li>Only ((3)) were permitted to raise silkworms and weave the fabric</li>
  <li>Only ((4)) were allowed to wear silk garments</li>
</ul>
<h3>Silk reaches the rest of the world</h3>
<ul>
  <li>Merchants on the Silk Road took silk westward and returned with ((7)) and precious metals</li>
  <li>Around 550 AD — two ((8)) smuggled silkworm eggs out of China</li>
</ul>
```

### Reading - Passage
**File:** `docs/passages/passage_silk.html`
```html
<div class='passage-section'>
  <span class='p-label'>Paragraph A</span>
  <p>Silk is a fine, strong, soft lustrous fibre produced by silkworms...</p>
</div>
<div class='passage-section'>
  <span class='p-label'>Paragraph B</span>
  <p>For about 3,000 years, the Chinese kept the secret of silk...</p>
</div>
```

### Listening - Instructions
**File:** `docs/instructions/section_1.html`
```html
<div class='passage-section'>
  <p>You will hear a student talking to an accommodation officer.</p>
  <p>Complete the form and table while you listen.</p>
</div>
```

---

## Command Line Examples

### Convert Reading Test (auto-detect output)
```bash
node scripts/excel-to-json.js docs/excels/IELTS-Reading-Test-01.xlsx
# Output: src/assets/data/reading-tests.json
```

### Convert Listening Test (auto-detect output)
```bash
node scripts/excel-to-json.js docs/excels/IELTS-Listening-Test-01.xlsx
# Output: src/assets/data/listening-tests.json
```

### Convert to custom path
```bash
node scripts/excel-to-json.js docs/excels/Demo.xlsx src/assets/data/demo.json
```

### Batch convert
```bash
for file in docs/excels/*.xlsx; do
  node scripts/excel-to-json.js "$file"
done
```

---

## Validation & Troubleshooting

### ✅ Conversion Success Output
```
📂 Reading Excel file: docs/excels/IELTS-Reading-Test-01.xlsx
✅ JSON saved to: src/assets/data/reading-tests.json
📊 Test: IELTS Academic Reading - Practice Test 1
📖 Parts: 2
❓ Questions: 26
```

### ❌ Common Errors

**Error: TEST_INFO sheet not found**
- Ensure you have a sheet named `TEST_INFO`
- Check spelling (case-sensitive)

**Error: HTML file not found**
- File path should be relative to project root
- Example: `passages/passage_silk.html` (not `../docs/...`)

**Warning: No parts found**
- Check PARTS sheet exists and has data
- Ensure `part_id` matches in QUESTION_GROUPS

**Warning: No answers found**
- Ensure ANSWERS sheet exists with data
- Column should be `q_id`, not `question_id`

---

## Tips

✅ **Best Practices:**
- One Excel file per test
- Keep folder structure organized
- Test conversion with small file first
- Validate JSON in editor before deploying
- Backup original Excel files

✅ **Naming Conventions:**
- Test ID: `ielts-reading-full-01` or `ielts-listening-full-01`
- Part ID: `full-01-p1`, `list-01-p1`, etc.
- Group ID: `p1-g1`, `p2-g2`, etc.
- File names: descriptive and lowercase

❌ **Avoid:**
- Spaces in file paths
- Special characters in IDs
- Mixing Reading/Listening in one Excel
- Changing column order in sheets
- Using empty rows in middle of data

---

## Workflow

```
1. Fill Excel template
   ↓
2. Save HTML files (passages, templates)
   ↓
3. Run: node scripts/excel-to-json.js <file>
   ↓
4. Check JSON output
   ↓
5. App automatically loads from JSON
   ↓
6. Students can practice!
```

---

## Next: Admin UI

Once conversion works, we'll build admin panel to:
- Upload Excel files directly
- Preview before conversion
- Manage converted tests
- Edit tests after creation

