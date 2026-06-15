# Upload & Deploy Guide - Excel → Firebase Storage

Complete workflow to upload Excel files and deploy JSON to Firebase.

---

## 📋 Quick Start (3 steps)

### **Step 1: Setup Firebase**
```bash
# Get service account key from Firebase Console
# → Project Settings → Service Accounts → Generate new private key

# Save as: firebaseServiceAccount.json

# Set environment variable:
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/firebaseServiceAccount.json"
```

### **Step 2: Edit Excel Template**
```
Open: docs/excels/TEMPLATE-Reading-Test-01.xlsx
→ Edit test data (passage, questions, answers)
→ Save as: docs/excels/My-Reading-Test-01.xlsx
```

### **Step 3: Upload & Deploy**
```bash
node scripts/upload-and-deploy.js docs/excels/My-Reading-Test-01.xlsx
```

**Output:**
```
✅ JSON created locally
✅ Uploaded to Firebase Storage
✅ DB record printed (copy & save to DB)
```

---

## 🔧 Detailed Setup

### **1. Firebase Configuration**

#### Get Service Account Key:
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Click **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save JSON file

#### Create credentials file:
```bash
# Save the JSON file as:
firebaseServiceAccount.json
```

#### Set environment variable:
```bash
# macOS/Linux:
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/firebaseServiceAccount.json"

# Windows (PowerShell):
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\firebaseServiceAccount.json"

# Permanent (add to ~/.zshrc or ~/.bashrc):
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/path/to/firebaseServiceAccount.json"
```

#### Update Firebase config in script:
Edit `scripts/upload-and-deploy.js`, line ~20:
```javascript
storageBucket: 'your-project-id.appspot.com'
```

Get from Firebase Console → Project Settings → General tab

---

### **2. Excel Template Structure**

**File:** `docs/excels/TEMPLATE-Reading-Test-01.xlsx`

#### Columns:
```
section | test_id | title | skill | source
        | part_number | part_title | passage_html | audio_url
        | group_id | group_type | group_range | group_instructions | template_html
        | q_id | q_text | option_a-e | answer | explanation
```

#### Sections:
- **TEST_METADATA**: Test info (stored in DB)
- **PART**: Section/part with passage
- **QUESTION_GROUP**: Question type & instructions
- **QUESTIONS**: Individual questions with answers

---

### **3. Test Data Format**

#### Passage HTML:
```html
<div class='passage'>
  <p><strong>Paragraph A</strong></p>
  <p>Full paragraph text with <strong>key words</strong>...</p>
  <p><strong>Paragraph B</strong></p>
  <p>More text...</p>
</div>
```

#### Template (for Note Completion):
```html
<h3>Title</h3>
<ul>
  <li>Sentence ((1)) with blank</li>
  <li>Another ((2)) with blank</li>
</ul>
```

#### Questions:
- **Fill-in (Note Completion)**: Leave `q_text` blank
- **True/False**: Add `q_text`, set options to `TRUE`, `FALSE`, `NOT GIVEN`
- **Multiple Choice**: Add `q_text`, add `option_a-e`

---

## 🚀 Workflow

### **Complete Example:**

```
1. Copy template:
   docs/excels/TEMPLATE-Reading-Test-01.xlsx
   → docs/excels/Reading-Advanced-01.xlsx

2. Edit in Excel:
   - Change test_id, title, source
   - Replace passage HTML
   - Edit questions & answers
   - Save

3. Run conversion:
   export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/firebaseServiceAccount.json"
   node scripts/upload-and-deploy.js docs/excels/Reading-Advanced-01.xlsx

4. Output:
   ✅ JSON: src/assets/data/reading-reading-advanced-01.json
   ✅ Firebase: tests/reading-reading-advanced-01.json
   
   DB Record:
   {
     "test_id": "ielts-reading-advanced-01",
     "title": "Advanced Reading Test",
     "skill": "Reading",
     "source": "IELTS9s",
     "link": "https://storage.googleapis.com/bucket/tests/reading-reading-advanced-01.json"
   }

5. Save DB record in database
```

---

## 📊 Generated Files

### **Local (src/assets/data/)**
```
reading-ielts-reading-01.json
```
Backup copy for offline/development

### **Firebase Storage (tests/)**
```
gs://bucket/tests/reading-ielts-reading-01.json
```
Public URL: `https://storage.googleapis.com/bucket/tests/...`

### **Database Record**
```json
{
  "test_id": "ielts-reading-01",
  "title": "IELTS Academic Reading - Practice Test 1",
  "skill": "Reading",
  "source": "IELTS9s Original",
  "link": "https://storage.googleapis.com/bucket/tests/reading-ielts-reading-01.json"
}
```

---

## ⚡ Quick Commands

```bash
# Setup environment (one time)
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/firebaseServiceAccount.json"

# Upload & deploy
node scripts/upload-and-deploy.js docs/excels/Reading-Test-01.xlsx

# Batch upload (multiple files)
for file in docs/excels/Reading-*.xlsx; do
  node scripts/upload-and-deploy.js "$file"
done

# Test locally (without Firebase)
# Just run the script without GOOGLE_APPLICATION_CREDENTIALS set
node scripts/upload-and-deploy.js docs/excels/Reading-Test-01.xlsx
```

---

## 🔍 Troubleshooting

### Firebase auth fails
```
❌ Error: 'GOOGLE_APPLICATION_CREDENTIALS' environment variable not set
```
**Fix:** Run before script:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"
```

### Excel read error
```
❌ Error reading Excel: ENOENT: no such file or directory
```
**Fix:** Check file path:
```bash
ls docs/excels/My-Reading-Test-01.xlsx
```

### Firebase bucket not found
```
❌ Error: bucket not found
```
**Fix:** Check bucket name in script (line ~20):
```javascript
storageBucket: 'your-project-id.appspot.com'
```

### Excel columns wrong
```
⚠️ No parts found in Excel
```
**Fix:** Check Excel structure:
- Row 1: TEST_METADATA
- Row 3: PART (section='PART')
- Row 5: QUESTION_GROUP (section='QUESTION_GROUP')
- Rows 6+: QUESTIONS (section='QUESTIONS')

---

## 📋 Checklist Before Upload

- [ ] Firebase credentials saved
- [ ] GOOGLE_APPLICATION_CREDENTIALS set
- [ ] Firebase bucket name correct
- [ ] Excel file has TEST_METADATA
- [ ] Excel file has at least 1 PART
- [ ] Excel file has at least 1 QUESTION_GROUP
- [ ] Excel file has QUESTIONS with answers
- [ ] Passages have proper HTML format
- [ ] Question types match supported types
- [ ] All answers filled in

---

## 🎯 Reading Question Types

Supported for Reading tests:
1. **Note Completion** - Fill with words
2. **True - False - Not Given** - Select T/F/NG
3. **Matching Information** - Match to paragraphs
4. **Matching Sentence Endings** - Complete sentences
5. **Multiple Choice** - Select A-D
6. **Multiple Choice (Multiple Answers)** - Select 2+ answers
7. **Headings Matching** - Match headings

---

## 📂 File Structure

```
docs/excels/
├── TEMPLATE-Reading-Test-01.xlsx  ← Use this as template
├── TEMPLATE-Listening-Test-01.xlsx
├── My-Reading-Test-01.xlsx        ← Your custom test
└── My-Listening-Test-01.xlsx

src/assets/data/
├── reading-my-reading-test-01.json  ← Auto-generated
└── listening-my-listening-test-01.json

scripts/
├── create-complete-template.js
├── upload-and-deploy.js             ← Main script
└── convert-flat-excel-simplified.js  ← Backup converter
```

---

## 🚀 Next: Test in App

Once deployed to Firebase:

1. **Update app config** - Store Firebase links
2. **Load from link** - App fetches JSON from Storage
3. **Student takes test** - Practice with your uploaded test
4. **Submit & score** - Results saved to database

---

## 💡 Tips

✅ Use template as starting point - it has correct format  
✅ Keep passage HTML clean and semantic  
✅ Test locally first (run without GOOGLE_APPLICATION_CREDENTIALS)  
✅ Check console output for DB record (copy it!)  
✅ Verify JSON in Firebase console after upload  
✅ Keep backup of Excel files  

---

**Ready to upload?** Let's go! 🚀
