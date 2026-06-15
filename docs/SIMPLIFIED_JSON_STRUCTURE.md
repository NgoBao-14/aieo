# Simplified JSON Structure

**JSON chỉ chứa content, DB chứa metadata**

---

## 📊 Old Structure (Dư thừa)
```json
{
  "id": "ielts-reading-01",           // ❌ Ở DB
  "title": "IELTS Reading Test 1",    // ❌ Ở DB
  "skill": "Reading",                 // ❌ Ở DB
  "source": "IELTS9s",                // ❌ Ở DB
  "attempts": 0,                      // ❌ Ở DB
  "parts": [...],
  "answerKey": {...},
  "explanations": {...}
}
```

---

## ✅ New Structure (Clean - Chỉ content)
```json
{
  "parts": [
    {
      "number": 1,
      "title": "THE STORY OF SILK",
      "passageHtml": "<div>...</div>",
      "questionGroups": [
        {
          "id": "g1",
          "type": "Note Completion",
          "range": "1-5",
          "instructions": "Complete notes...",
          "template": "<h3>...</h3>",
          "questions": [
            { "id": 1 },
            { "id": 2 }
          ]
        },
        {
          "id": "g2",
          "type": "True - False - Not Given",
          "range": "6-10",
          "instructions": "Do statements agree?",
          "questions": [
            {
              "id": 6,
              "text": "Statement here?",
              "options": ["TRUE", "FALSE", "NOT GIVEN"]
            }
          ]
        }
      ]
    }
  ],
  "answerKey": {
    "1": "tea",
    "2": "reel",
    "6": "TRUE"
  },
  "explanations": {
    "1": "She picked tea from cup...",
    "2": "She developed silk reel...",
    "6": "Anyone caught was punished..."
  }
}
```

---

## 📋 DB Schema (Separate)
```json
{
  "test_id": "ielts-reading-01",
  "title": "IELTS Academic Reading - Test 1",
  "skill": "Reading",
  "source": "IELTS9s Original",
  "attempts": 1024,
  "link": "https://cdn.example.com/ielts-reading-01.json"
}
```

---

## 🎯 Mapping

**Excel 5 columns:**
1. `question_id` - Q number (1, 2, 3...)
2. `question_text` - Q text (or blank if template-based)
3. `options` - Answers (if multiple choice)
4. `correct_answer` - Right answer
5. `explanation` - Why it's right

**Plus metadata rows:**
- Part number & title
- Passage HTML
- Question group type & instructions
- Template HTML

---

## 🚀 Simplified

**Essential columns only:**
```
part_number | part_title | passage_html | group_type | group_instructions | template_html | q_id | q_text | q_options | answer | explanation
```

Each row = 1 question, with context headers above.

**That's it!**
