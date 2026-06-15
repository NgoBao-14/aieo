# Excel Template Structure for IELTS Tests

## Overview
**1 Excel file per test** with multiple sheets. Each sheet represents one level of the test hierarchy.

## File Naming
```
IELTS-Reading-Test-01.xlsx
IELTS-Listening-Test-01.xlsx
```

## Sheet 1: TEST_INFO
Basic test metadata

| Field | Value | Type | Example |
|-------|-------|------|---------|
| test_id | ielts-reading-full-01 | text | required, unique |
| title | IELTS Academic Reading - Practice Test 1 | text | required |
| skill | Reading | text | Reading or Listening |
| source | IELTS9s Original | text | optional |
| attempts | 1024 | number | optional, default 0 |

**Example:**
```
test_id,title,skill,source,attempts
ielts-reading-full-01,IELTS Academic Reading - Practice Test 1,Reading,IELTS9s Original,1024
```

---

## Sheet 2: PARTS
One row per part/section

| part_id | part_number | title | passage_html_file | audio_url | instructions |
|---------|-------------|-------|-------------------|-----------|--------------|
| full-01-p1 | 1 | THE STORY OF SILK | passage_1.html | (leave blank) | (leave blank) |
| full-01-p2 | 2 | THE PSYCHOLOGY... | passage_2.html | (leave blank) | (leave blank) |

**For Listening:**
| part_id | part_number | title | passage_html_file | audio_url | instructions |
|---------|-------------|-------|-------------------|-----------|--------------|
| list-01-p1 | 1 | SECTION 1 | instructions_1.html | https://... | (leave blank) |

**Notes:**
- `passage_html_file`: Reference to HTML file in `docs/passages/` folder (for Reading)
- `audio_url`: Direct URL for audio (for Listening)
- Leave unused columns blank

---

## Sheet 3: QUESTION_GROUPS
Groups of questions by type

| part_id | group_id | group_type | range | instructions | template_file | render_type | input_type |
|---------|----------|-----------|-------|--------------|---------------|-------------|-----------|
| full-01-p1 | p1-g1 | Note Completion | 1-8 | Complete notes... | template_1.html | (blank) | (blank) |
| full-01-p1 | p1-g2 | True - False - Not Given | 9-13 | Do statements... | (blank) | (blank) | (blank) |
| list-01-p1 | l1-g1 | Form Completion | 1-4 | Complete form... | template_form.html | (blank) | (blank) |

**Supported Types:**
- Note Completion
- True - False - Not Given
- Matching Information
- Matching Sentence Endings
- Multiple Choice
- Multiple Choice (Multiple Answers)
- Form Completion
- Table Completion
- Flow-chart Completion
- Sentence Completion
- Headings Matching
- Diagram Labelling
- Map Labelling
- Matching Features

**Notes:**
- If type has template (like Note Completion), put HTML file reference in `template_file`
- Some types auto-generate from questions (True/False, Multiple Choice)

---

## Sheet 4: QUESTIONS
Individual questions with text and options

| group_id | q_id | q_text | option_a | option_b | option_c | option_d | option_e | option_f | option_g |
|----------|------|--------|----------|----------|----------|----------|----------|----------|----------|
| p1-g1 | 1 | (blank) | (blank) | (blank) | (blank) | (blank) | (blank) | (blank) | (blank) |
| p1-g2 | 9 | The Chinese penalty for... | TRUE | FALSE | NOT GIVEN | (blank) | (blank) | (blank) | (blank) |
| p1-g2 | 10 | Gold was most valuable... | TRUE | FALSE | NOT GIVEN | (blank) | (blank) | (blank) | (blank) |

**Rules:**
- Fill `q_text` only if question needs text (True/False, Multiple Choice, etc.)
- Leave blank if text comes from template (Note Completion, Form Completion)
- Fill `option_x` columns for questions with choices
- Use exactly as shown (e.g., "TRUE", "FALSE", "NOT GIVEN")

---

## Sheet 5: ANSWERS_&_EXPLANATIONS
Answer key and explanations

| q_id | correct_answer | explanation |
|------|----------------|-------------|
| 1 | tea | She picked tea out of her cup when a cocoon fell in |
| 2 | reel | She developed the silk reel and loom |
| 3 | women | Only women were entrusted with raising silkworms |
| 9 | TRUE | Anyone caught smuggling was punished by death |
| 10 | FALSE | Wool and precious metals were mentioned, not gold as most valuable |

**Notes:**
- `correct_answer`: Must match option text exactly (case-insensitive internally)
- For multiple choice: use exact option text (e.g., "A. A single room...")
- For fill-in: use the word/phrase (e.g., "tea", "reel", "women")

---

## Folder Structure for Files

```
docs/
├── EXCEL_STRUCTURE.md (this file)
├── passages/
│   ├── passage_1.html  (Reading 1 HTML)
│   ├── passage_2.html  (Reading 2 HTML)
│   └── ...
├── instructions/
│   ├── instructions_1.html  (Listening instruction)
│   └── ...
├── templates/
│   ├── template_1.html  (Note Completion template)
│   ├── template_form.html  (Form template)
│   └── ...
└── excels/
    ├── IELTS-Reading-Test-01.xlsx
    ├── IELTS-Listening-Test-01.xlsx
    └── ...
```

---

## Example: Complete Test Flow

### Reading Test Example
**TEST_INFO:**
```
ielts-reading-full-01 | IELTS Reading Test 1 | Reading | IELTS9s Original | 1024
```

**PARTS:**
```
full-01-p1 | 1 | THE STORY OF SILK | passage_silk.html | (blank) | (blank)
```

**QUESTION_GROUPS:**
```
full-01-p1 | p1-g1 | Note Completion | 1-8 | Complete notes... | template_silk.html | (blank) | (blank)
full-01-p1 | p1-g2 | True - False - Not Given | 9-13 | Do statements... | (blank) | (blank) | (blank)
```

**QUESTIONS:**
```
p1-g1 | 1 | (blank) | (blank) | ... (Note Completion has no text in this sheet)
p1-g2 | 9 | The Chinese penalty for... | TRUE | FALSE | NOT GIVEN | (blank) ...
p1-g2 | 10 | Gold was most valuable... | TRUE | FALSE | NOT GIVEN | (blank) ...
```

**ANSWERS:**
```
1 | tea | She picked tea from her cup when cocoon fell in
9 | TRUE | Anyone caught smuggling was punished by death
10 | FALSE | Wool and metals were mentioned, not gold as most valuable
```

---

## Conversion Process

1. **Fill Excel** with test data
2. **Save all passage/template HTML files** in `docs/passages/` and `docs/templates/`
3. **Run conversion script**: `node convert-excel-to-json.js <excel-file>`
4. **Output**: JSON file saved to `src/assets/data/reading-tests.json` or `listening-tests.json`
5. **App loads** from JSON file automatically

---

## Tips

✅ **DO:**
- Keep sheet structure consistent
- Use exact column headers
- Fill required fields (test_id, title, skill)
- Test conversion before deployment
- Keep one Excel per test

❌ **DON'T:**
- Skip headers in sheets
- Change column order
- Mix Reading/Listening in one file
- Leave empty rows in middle of data

