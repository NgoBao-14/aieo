# IELTS9s - Test Data Structure & Question Types

Complete guide for understanding test structure and all supported question types.

---

## 📊 Test Data Structure

### **Level 1: Test Object**
```json
{
  "id": "ielts-reading-01",
  "title": "IELTS Academic Reading - Test 1",
  "skill": "Reading" | "Listening",
  "source": "IELTS9s Original",
  "attempts": 0,
  "parts": [...],
  "answerKey": { "1": "answer", "2": "answer", ... },
  "explanations": { "1": "explanation", "2": "explanation", ... }
}
```

### **Level 2: Part (Section)**
```json
{
  "id": "p1",
  "number": 1,
  "title": "THE STORY OF SILK",
  "passageHtml": "<div>...</div>",      // Reading only
  "audioUrl": "https://...",            // Listening only
  "questionTypes": ["Note Completion", "True - False - Not Given"],
  "questionGroups": [...]
}
```

### **Level 3: Question Group (Type)**
```json
{
  "id": "g1",
  "type": "Note Completion",            // Question type
  "range": "1-8",                       // Question numbers
  "instructions": "Complete notes...",
  "template": "<h3>...</h3>",           // Optional (for template-based)
  "questions": [...]
}
```

### **Level 4: Question**
```json
{
  "id": 1,
  "text": "What is...?",                    // Optional (if type requires)
  "options": ["A. ...", "B. ...", "C. ..."]  // Optional (if multiple choice)
}
```

### **Level 5: Answers (Flat Map)**
```json
{
  "answerKey": {
    "1": "tea",          // Fill-in answer
    "9": "TRUE",         // True/False answer
    "14": "B",           // Multiple choice answer
    "23": "A, B"         // Multi-select answer
  },
  "explanations": {
    "1": "She picked tea from her cup...",
    "9": "The passage states..."
  }
}
```

---

## 🎯 Question Types

### **READING - 7 Types**

#### 1. **Note Completion**
- **What**: Fill blanks in notes from passage
- **Answer**: Single word or phrase from passage
- **Structure**: Has `template` with `((1))` placeholders
- **Excel Columns**: q_id, (q_text blank), (options blank)
- **Answer**: `tea`, `reel`, `women`

```
Template: "Around 3000 BC — discovered silk when cocoon fell into her ((1))"
Answer: "tea"
```

#### 2. **True - False - Not Given**
- **What**: Statements matching passage info
- **Answer**: TRUE, FALSE, or NOT GIVEN
- **Structure**: Has `text` and `options: ["TRUE", "FALSE", "NOT GIVEN"]`
- **Excel Columns**: q_id, q_text, option_a (TRUE), option_b (FALSE), option_c (NOT GIVEN)
- **Answer**: `TRUE` or `FALSE` or `NOT GIVEN`

```
Q9: "The Chinese penalty for revealing silk was execution."
Answer: "TRUE"
```

#### 3. **Matching Information**
- **What**: Match statements to paragraphs (A-F)
- **Answer**: Paragraph letter (A, B, C, D, E, F)
- **Structure**: `renderType: "grid"` with columns: [A, B, C, D, E, F]
- **Excel Columns**: q_id, q_text, option_a (A), option_b (B), ... option_f (F)
- **Answer**: `B`, `C`, `A`

```
Q14: "neurological evidence of procrastination"
Answer: "B"  (Paragraph B discusses neuroscience)
```

#### 4. **Matching Sentence Endings**
- **What**: Complete sentences with endings (A-G or more)
- **Answer**: Ending letter
- **Structure**: Has `template` with `((17))` placeholders and `options` array
- **Excel Columns**: q_id, (blank), option_a-g (endings)
- **Answer**: `B`, `E`, `D`

```
Q17: "Pychyl and Flett's research found that frequent procrastinators..."
Options: A. have..., B. report lower job..., C. experience...
Answer: "B"
```

#### 5. **Multiple Choice (Single)**
- **What**: Choose 1 correct answer
- **Answer**: Letter (A, B, C, D, E)
- **Structure**: Has `text` and `options` array
- **Excel Columns**: q_id, q_text, option_a, option_b, option_c, (option_d, option_e optional)
- **Answer**: `A`, `B`, `C`

```
Q21: "What is the main idea?"
Options: A. ..., B. ..., C. ...
Answer: "B"
```

#### 6. **Multiple Choice (Multiple Answers)**
- **What**: Choose 2+ correct answers
- **Answer**: Multiple letters (A, B)
- **Structure**: Same as single, but answers are comma-separated
- **Excel Columns**: q_id, q_text, option_a-e, option_f-g
- **Answer**: `A, B` or `B, D`

```
Q21-22: "Which TWO of the following..."
Answer: "B, D"
```

#### 7. **Heading Matching**
- **What**: Match paragraph headings
- **Answer**: Heading text or number
- **Structure**: `renderType: "headings"` with `headings` array
- **Excel Columns**: q_id, q_text (paragraph summary)
- **Answer**: Heading text

```
Q11: "The evolution of transportation"
Headings: [i. Historical Development, ii. Modern Systems, iii. Environmental Impact]
Answer: "i"
```

---

### **LISTENING - 8 Types**

#### 1. **Form Completion**
- **What**: Fill form blanks from audio
- **Answer**: 1-3 words from audio
- **Structure**: Has `template` with `((1))` placeholders
- **Excel Columns**: q_id, (blank), (blank)
- **Answer**: `John Smith`, `15 June`, `6 months`

```
Template: "Name: ((1))"
Answer: "John Smith"
```

#### 2. **Multiple Choice (Single/Multiple)**
- **What**: Choose correct answer(s) from audio
- **Answer**: Letter (A, B, C) or multiple (A, B)
- **Structure**: Has `text` and `options` array
- **Excel Columns**: q_id, q_text, option_a, option_b, option_c
- **Answer**: `A` or `B, C`

```
Q5: "What is the student's budget?"
Options: A. £100, B. £150, C. £200
Answer: "B"
```

#### 3. **Table Completion**
- **What**: Fill table blanks from audio
- **Answer**: 1-3 words from audio
- **Structure**: Has `template` with table and `((n))` placeholders
- **Excel Columns**: q_id, (blank), (blank)
- **Answer**: `Orientation`, `Main Hall`, `City Tour`

```
Template: "<table><tr><td>12th May</td><td>Orientation</td><td>((8))</td></tr></table>"
Answer: "Library"
```

#### 4. **Flow-chart Completion**
- **What**: Fill flowchart with words/phrases from audio
- **Answer**: 1-3 words from audio
- **Structure**: Has `template` with `((n))` in flowchart
- **Excel Columns**: q_id, (blank), (blank)
- **Answer**: `research question`, `existing knowledge`, `methodology`

```
Template: "Stage 1: ((25))" 
Answer: "Choose topic"
```

#### 5. **Sentence Completion**
- **What**: Complete sentences from audio
- **Answer**: 1-3 words from audio
- **Structure**: Has `template` with `((n))` placeholders
- **Excel Columns**: q_id, (blank), (blank)
- **Answer**: `visual aids`, `clear structure`

```
Template: "29. The students were surprised by the ((29)) of results"
Answer: "complexity"
```

#### 6. **Matching Features**
- **What**: Match items to roles/features from audio
- **Answer**: Option letter
- **Structure**: `renderType: "choice"` with drag-drop or select
- **Excel Columns**: q_id, q_text (item), option_a-h (roles)
- **Answer**: `B`, `E`, `D`

```
Q11: "walking around the town centre"
Options: A. providing entertainment, B. providing publicity, C. contacting businesses...
Answer: "B"
```

#### 7. **Map Labelling**
- **What**: Label locations on map from audio
- **Answer**: Letter (A-H) or coordinate
- **Structure**: Has `template` with `((n))` for labels
- **Excel Columns**: q_id, (blank), (blank)
- **Answer**: `A`, `C`, `E`

```
Template: "17. Cafe ((17))"
Answer: "A"
```

#### 8. **Short Answer**
- **What**: Short answers to questions (1-3 words)
- **Answer**: Specific words/phrases from audio
- **Structure**: Has `text` with question
- **Excel Columns**: q_id, q_text (question), (blank)
- **Answer**: `tea break`, `afternoon`

```
Q30: "What time is the break?"
Answer: "2 PM"
```

---

## 📋 Excel Mapping

### **Question Type → Excel Input**

| Type | q_text | option_a | option_b | option_c | option_d | template_file |
|------|--------|----------|----------|----------|----------|---------------|
| Note Completion | blank | blank | blank | blank | blank | ✅ required |
| True/False | ✅ required | TRUE | FALSE | NOT GIVEN | blank | blank |
| Matching Info | ✅ required | A | B | C | D-F... | blank |
| Matching Endings | blank | blank | blank | blank | blank | ✅ required |
| Multiple Choice | ✅ required | A. ... | B. ... | C. ... | D. ... | blank |
| Headings | ✅ required | Heading1 | Heading2 | Heading3 | ... | blank |
| Form Completion | blank | blank | blank | blank | blank | ✅ required |
| Table Completion | blank | blank | blank | blank | blank | ✅ required |
| Flow-chart | blank | blank | blank | blank | blank | ✅ required |
| Sentence Comp. | blank | blank | blank | blank | blank | ✅ required |
| Matching Features | ✅ required | Role1 | Role2 | Role3 | ... | blank |
| Map Labelling | blank | blank | blank | blank | blank | ✅ required |
| Short Answer | ✅ required | blank | blank | blank | blank | blank |

---

## 🎯 Naming Conventions

### **IDs**
- **test_id**: `ielts-reading-01`, `ielts-listening-01`
- **part_id**: `p1`, `p2`, `l1-p1`
- **group_id**: `g1`, `g2`, `l1-g1`
- **q_id**: `1`, `2`, `3`, ..., `40`

### **Files**
- **Passages**: `passages/topic_name.html`
- **Instructions**: `instructions/section_n.html`
- **Templates**: `templates/type_name.html`

---

## ✅ Full Test Example (Reading)

```
TEST_INFO:
- test_id: ielts-reading-01
- title: IELTS Academic Reading - Test 1
- skill: Reading
- source: IELTS9s Original

PARTS:
- Part 1: THE STORY OF SILK (passages/silk.html)
- Part 2: PROCRASTINATION (passages/procrastination.html)
- Part 3: ARCHITECTURE (passages/architecture.html)

QUESTION_GROUPS:
Part 1:
- Group 1: Note Completion (1-8) [template_silk.html]
- Group 2: True/False (9-13)

Part 2:
- Group 1: Matching Info (14-16) [grid format]
- Group 2: Matching Endings (17-20) [template]
- Group 3: Multiple Choice (21-22)
- Group 4: Note Comp. (23-26) [template]

QUESTIONS: 26 total
- 1-8: Note completion (no text)
- 9-13: True/False statements
- 14-16: Info matching (paragraph letters)
- 17-20: Sentence endings (letters A-G)
- 21-22: Multiple choice (A, B, C, D, E)
- 23-26: Note completion (no text)

ANSWERS: 26 entries with explanations
```

---

## 📝 Excel Template Columns

```
TEST_INFO:
- test_id | title | skill | source | attempts

PARTS:
- part_id | part_number | title | passage_html_file | audio_url

QUESTION_GROUPS:
- part_id | group_id | group_type | range | instructions | template_file

QUESTIONS:
- group_id | q_id | q_text | option_a | option_b | option_c | option_d | option_e | option_f | option_g

ANSWERS_&_EXPLANATIONS:
- q_id | correct_answer | explanation
```

---

## 🚀 Summary for LMS Development

**Question types are flexible** - you can support more by:
1. Adding to `parseQuestionGroupType()` in conversion script
2. Creating new rendering components
3. Updating Excel template

**Data structure is normalized** - each test is independent JSON file:
- Reading test 1: `ielts-reading-01.json`
- Listening test 2: `ielts-listening-02.json`

**Answers are flat** - easy to match with student responses:
```
studentAnswers = { "1": "tea", "9": "TRUE", "21": "B" }
correctAnswers = { "1": "tea", "9": "TRUE", "21": "B" }
score = compare()
```

This structure scales well for 100s of tests in LMS.
