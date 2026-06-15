# IELTS9s Admin Panel & Excel to JSON Workflow

Complete guide for managing IELTS tests via Excel files and Admin Panel.

## 🎯 Overview

**Goal**: Manage Reading & Listening tests efficiently using:
1. **Excel Template** - Easy data input
2. **Conversion Script** - Excel → JSON
3. **Admin Panel** - View/manage tests in UI
4. **JSON Files** - App loads from static JSON (fast, no DB queries)

---

## 📋 Quick Start (5 minutes)

### Step 1: Fill Excel Template
```bash
docs/excels/IELTS-Reading-Test-01.xlsx
```
See `EXCEL_STRUCTURE.md` for detailed schema.

### Step 2: Create HTML Files
```
docs/
├── passages/passage_silk.html    (Reading content)
├── instructions/section_1.html   (Listening instructions)
└── templates/template_form.html   (Question template)
```

### Step 3: Convert Excel to JSON
```bash
node scripts/excel-to-json.js docs/excels/IELTS-Reading-Test-01.xlsx
# Output: src/assets/data/reading-tests.json
```

### Step 4: App Loads Automatically ✨
Tests are now available in the app!

---

## 📁 File Structure

```
ielts9s/
├── docs/
│   ├── EXCEL_STRUCTURE.md           ← Excel schema guide
│   ├── EXCEL_TO_JSON_GUIDE.md       ← Detailed conversion guide
│   ├── excels/
│   │   ├── IELTS-Reading-Test-01.xlsx
│   │   └── IELTS-Listening-Test-01.xlsx
│   ├── passages/
│   │   ├── passage_silk.html
│   │   ├── passage_psychology.html
│   │   └── ...
│   ├── instructions/
│   │   ├── section_1.html
│   │   └── ...
│   └── templates/
│       ├── template_form.html
│       ├── template_matching.html
│       └── ...
│
├── scripts/
│   └── excel-to-json.js            ← Conversion script
│
├── src/
│   ├── assets/data/
│   │   ├── reading-tests.json      ← Generated, loads in app
│   │   ├── listening-tests.json    ← Generated, loads in app
│   │   └── tests.json              ← Fallback/merged
│   │
│   └── app/
│       └── features/admin/
│           ├── admin-layout.component.ts
│           ├── admin-layout.component.scss
│           ├── admin.routes.ts
│           │
│           ├── dashboard/
│           │   └── admin-dashboard.component.ts
│           │
│           └── test-management/
│               ├── test-management.component.ts
│               ├── test-management.component.scss
│               ├── test-form.component.ts
│               └── test-form.component.scss
│
└── README.md (main)
```

---

## 📝 Excel Template

**One file per test with 5 sheets:**

### Sheet 1: TEST_INFO
```
test_id,title,skill,source,attempts
ielts-reading-full-01,IELTS Academic Reading - Test 1,Reading,IELTS9s Original,1024
```

### Sheet 2: PARTS
```
part_id,part_number,title,passage_html_file,audio_url
full-01-p1,1,THE STORY OF SILK,passages/passage_silk.html,
full-01-p2,2,THE PSYCHOLOGY...,passages/passage_psychology.html,
```

### Sheet 3: QUESTION_GROUPS
```
part_id,group_id,group_type,range,instructions,template_file
full-01-p1,p1-g1,Note Completion,1-8,Complete notes...,templates/template_silk.html
full-01-p1,p1-g2,True - False - Not Given,9-13,Do statements...,
```

### Sheet 4: QUESTIONS
```
group_id,q_id,q_text,option_a,option_b,option_c,option_d
p1-g1,1,,,,,,
p1-g2,9,Chinese penalty was execution?,TRUE,FALSE,NOT GIVEN,
```

### Sheet 5: ANSWERS_&_EXPLANATIONS
```
q_id,correct_answer,explanation
1,tea,She picked tea from her cup when cocoon fell in
9,TRUE,Anyone caught smuggling was punished by death
```

**📖 Full Details**: See `docs/EXCEL_STRUCTURE.md`

---

## 🔄 Conversion Script: Excel → JSON

### Installation
```bash
# Already included in package.json
npm install
```

### Usage
```bash
# Auto-detect output based on skill
node scripts/excel-to-json.js docs/excels/IELTS-Reading-Test-01.xlsx
# Output: src/assets/data/reading-tests.json

# Or specify custom output
node scripts/excel-to-json.js docs/excels/Demo.xlsx src/assets/data/demo.json
```

### Script Features
- ✅ Reads Excel file with multiple sheets
- ✅ Loads HTML files (passages, templates)
- ✅ Validates structure
- ✅ Auto-generates JSON
- ✅ Updates existing JSON (append or merge)
- ✅ Outputs to correct file (`reading-tests.json`, `listening-tests.json`)

### Output Example
```json
[
  {
    "id": "ielts-reading-full-01",
    "title": "IELTS Academic Reading - Practice Test 1",
    "skill": "Reading",
    "source": "IELTS9s Original",
    "attempts": 1024,
    "parts": [
      {
        "id": "full-01-p1",
        "number": 1,
        "title": "THE STORY OF SILK",
        "passageHtml": "<div>...</div>",
        "questionGroups": [...]
      }
    ],
    "answerKey": { "1": "tea", "2": "reel", ... },
    "explanations": { "1": "She picked tea...", ... }
  }
]
```

---

## 🎛️ Admin Panel

### Access
```
/admin/dashboard
/admin/tests
/admin/tests/new
/admin/tests/:testId/edit
/admin/import-export
```

### Features

#### Dashboard
- Total tests count
- Reading/Listening breakdown
- Total questions
- Quick action buttons

#### Test Management
- List all tests
- Filter by skill (Reading/Listening)
- View test details
- Edit test
- Delete test (coming soon)
- Download test as JSON
- Import from JSON

#### Test Form
- Create new test (coming soon)
- Edit existing test (coming soon)
- Upload JSON file
- Real-time preview

### Protection
- Admin routes protected by `AdminGuard`
- Requires user to be logged in
- TODO: Implement admin role check

---

## 🔐 Security & Workflow

### Current Workflow
1. **Input**: Fill Excel locally
2. **Process**: Run conversion script locally
3. **Storage**: JSON saved in `src/assets/data/`
4. **Delivery**: App loads from JSON
5. **Deploy**: Commit JSON to git, deploy with app

### Advantages
✅ No real-time DB queries (fast)
✅ Version controlled (git)
✅ Offline-first
✅ Simple to backup
✅ No admin UI needed initially

### Future Improvements
- Admin UI for full CRUD
- Firebase storage option
- Bulk import UI
- Live preview
- Role-based access control

---

## 📋 Supported Question Types

### Reading
- Note Completion
- True - False - Not Given
- Matching Information
- Matching Sentence Endings
- Multiple Choice
- Headings Matching
- Sentence Completion

### Listening
- Form Completion
- Multiple Choice
- Multiple Choice (Multiple Answers)
- Table Completion
- Flow-chart Completion
- Matching Features
- Map Labelling
- Sentence Completion

---

## 🚀 Batch Processing

### Convert Multiple Tests
```bash
for file in docs/excels/*.xlsx; do
  echo "Converting $file..."
  node scripts/excel-to-json.js "$file"
done
```

### Verify Output
```bash
# Check if JSON is valid
node -e "const data = require('./src/assets/data/reading-tests.json'); console.log('Tests:', data.length);"
```

---

## 🐛 Troubleshooting

### "TEST_INFO sheet not found"
- Ensure Excel file has sheet named `TEST_INFO`
- Check spelling (case-sensitive)

### "HTML file not found: passages/..."
- File path is relative to project root
- Example: `passages/silk.html` (not `../docs/...`)
- Create file in `docs/passages/` folder

### "No parts found"
- Check PARTS sheet exists
- Verify `part_id` column
- Ensure data in sheet

### "No answers found"
- Check ANSWERS_&_EXPLANATIONS sheet
- Verify `q_id` column

### JSON validation error
```bash
# Test JSON validity
node -e "JSON.parse(require('fs').readFileSync('src/assets/data/reading-tests.json'))" && echo "Valid JSON"
```

---

## ✅ Testing Workflow

### 1. Create Sample Test
```
docs/excels/Sample-Reading.xlsx
```

### 2. Convert
```bash
node scripts/excel-to-json.js docs/excels/Sample-Reading.xlsx
```

### 3. Verify Output
```bash
# Check file was created
ls -la src/assets/data/reading-tests.json

# View content
cat src/assets/data/reading-tests.json | jq '.[0] | {id, title, parts: (.parts | length)}'
```

### 4. Test in App
```bash
ng serve
# Visit http://localhost:4200
# Check Practice Library for new test
```

---

## 📊 Migration Path

### Phase 1: Current (Excel → JSON)
- ✅ Excel input
- ✅ Script conversion
- ✅ JSON output
- ✅ Static loading

### Phase 2: Admin UI (Coming)
- [ ] Full CRUD in browser
- [ ] Live preview
- [ ] Firebase storage
- [ ] Role-based access

### Phase 3: Teacher Features
- [ ] Class management
- [ ] Assignment system
- [ ] Student tracking
- [ ] Advanced analytics

---

## 📚 References

- **Excel Structure**: `docs/EXCEL_STRUCTURE.md`
- **Conversion Guide**: `docs/EXCEL_TO_JSON_GUIDE.md`
- **Test Schema**: `src/app/models/app.models.ts`
- **Existing Tests**: `src/assets/data/`

---

## 🤝 Contributing

When adding new question types:
1. Update `parseQuestionGroupType()` in `scripts/excel-to-json.js`
2. Add to supported types list in docs
3. Test conversion
4. Update rendering components if needed

---

## 🎓 Example: Reading Test

### Files Needed
```
docs/excels/Reading-Test-01.xlsx      ← Main template
docs/passages/passage_1.html           ← Part 1 content
docs/passages/passage_2.html           ← Part 2 content
docs/templates/template_notes.html     ← Questions template
```

### Quick Conversion
```bash
node scripts/excel-to-json.js docs/excels/Reading-Test-01.xlsx
```

### Result
✅ Test available in `/practice` page
✅ Students can take the test
✅ Auto-scoring works
✅ Results saved

---

## Questions?

See docs folder or check admin panel for more details.

**Happy test creation! 🚀**
