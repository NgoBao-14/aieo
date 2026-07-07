import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { Test, TestPart, QuestionGroup, Question } from '../../models/app.models';

@Injectable({
  providedIn: 'root'
})
export class ExcelParserService {

  constructor() {}

  /**
   * Parses an Excel File (as ArrayBuffer) into a Test object.
   */
  parseExcel(arrayBuffer: ArrayBuffer): Test {
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    const sheets: Record<string, any[]> = {};

    workbook.SheetNames.forEach(name => {
      sheets[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
    });

    const testInfo = sheets['TEST_INFO']?.[0];
    if (!testInfo) {
      throw new Error('TEST_INFO sheet not found or empty. Please check the Excel file.');
    }

    const testId = testInfo.test_id || testInfo['test_id'];
    const title = testInfo.title || testInfo['title'];
    const skill = (testInfo.skill || testInfo['skill'] || 'Reading') as 'Reading' | 'Listening';
    const source = testInfo.source || testInfo['source'] || 'IELTS9s Original';
    const attempts = parseInt(testInfo.attempts || testInfo['attempts']) || 0;

    if (!testId || !title) {
      throw new Error('Missing test_id or title in TEST_INFO sheet.');
    }

    const partsData = sheets['PARTS'] || [];
    const groupsData = sheets['QUESTION_GROUPS'] || [];
    const questionsData = sheets['QUESTIONS'] || [];
    const answersData = sheets['ANSWERS_&_EXPLANATIONS'] || sheets['ANSWERS'] || [];

    const test: Test = {
      id: String(testId).trim(),
      title: String(title).trim(),
      skill,
      source: String(source).trim(),
      attempts,
      parts: [],
      answerKey: {},
      explanations: {},
      createdAt: new Date().toISOString()
    };

    // Build parts
    partsData.forEach((partData: any) => {
      const partId = String(partData.part_id || '').trim();
      const partNumber = parseInt(partData.part_number || partData.number) || 1;
      const partTitle = String(partData.title || '').trim();
      
      const part: TestPart = {
        id: partId,
        number: partNumber,
        title: partTitle,
        questionGroups: []
      };

      // Store HTML paths as metadata or placeholder so UI can allow uploading/editing
      if (partData.passage_html_file) {
        part.passageHtml = `[FILE_PATH:${String(partData.passage_html_file).trim()}]`;
      }
      if (partData.audio_url) {
        part.audioUrl = String(partData.audio_url).trim();
      }

      // Filter and build question groups for this part
      const partGroupsData = groupsData.filter((g: any) => String(g.part_id || '').trim() === partId);
      
      part.questionGroups = partGroupsData.map((groupData: any) => {
        const groupId = String(groupData.group_id || '').trim();
        const groupType = String(groupData.group_type || '').trim();
        const range = String(groupData.range || '').trim();
        const instructions = String(groupData.instructions || '').trim();
        const templateFile = groupData.template_file ? String(groupData.template_file).trim() : '';

        const typeInfo = this.parseQuestionGroupType(groupType);

        // Build questions for this group
        const groupQuestions = questionsData
          .filter((q: any) => String(q.group_id || '').trim() === groupId)
          .map((q: any) => {
            const qId = parseInt(q.q_id || q.id) || q.q_id;
            const question: Question = {
              id: qId
            };

            if (q.q_text && String(q.q_text).trim()) {
              question.text = String(q.q_text).trim();
            }

            const options: string[] = [];
            const optionFields = ['option_a', 'option_b', 'option_c', 'option_d', 'option_e', 'option_f', 'option_g'];
            optionFields.forEach(field => {
              if (q[field] && String(q[field]).trim()) {
                options.push(String(q[field]).trim());
              }
            });

            if (options.length > 0) {
              question.options = options;
            }

            return question;
          });

        const group: QuestionGroup = {
          id: groupId,
          type: groupType,
          range,
          instructions,
          questions: groupQuestions
        };

        if (templateFile) {
          group.template = `[TEMPLATE_PATH:${templateFile}]`;
        }
        if (groupData.render_type && String(groupData.render_type).trim()) {
          group.renderType = String(groupData.render_type).trim();
        } else if (typeInfo.renderType) {
          group.renderType = typeInfo.renderType;
        }
        if (groupData.input_type && String(groupData.input_type).trim()) {
          group.inputType = String(groupData.input_type).trim();
        } else if (typeInfo.inputType) {
          group.inputType = typeInfo.inputType;
        }

        return group;
      });

      // Map question types
      part.questionTypes = [...new Set(part.questionGroups.map(g => g.type))];

      test.parts.push(part);
    });

    // Sort parts by number
    test.parts.sort((a, b) => a.number - b.number);

    // Build answerKey and explanations
    answersData.forEach((answer: any) => {
      const qId = String(answer.q_id || '').trim();
      if (qId) {
        test.answerKey[qId] = String(answer.correct_answer || '').trim();
        if (answer.explanation && String(answer.explanation).trim()) {
          test.explanations[qId] = String(answer.explanation).trim();
        }
      }
    });

    // Populate metadata
    test.partsCount = test.parts.length;
    test.questionCount = Object.keys(test.answerKey).length;
    test.questionTypes = [...new Set(test.parts.flatMap(p => p.questionTypes || []))];

    return test;
  }

  private parseQuestionGroupType(typeStr: string) {
    const type = typeStr?.trim() || '';
    const templates: Record<string, { renderType?: string, inputType?: string }> = {
      'Note Completion': { inputType: 'fill' },
      'Form Completion': { inputType: 'fill' },
      'Table Completion': { inputType: 'fill' },
      'Sentence Completion': { inputType: 'fill' },
      'Flow-chart Completion': { inputType: 'fill' },
      'Diagram Labelling': { inputType: 'fill' },
      'Map Labelling': { inputType: 'fill' },
      'True - False - Not Given': { renderType: 'choice' },
      'Matching Information': { renderType: 'grid' },
      'Matching Features': { renderType: 'choice' },
      'Matching Sentence Endings': { renderType: 'choice' },
      'Multiple Choice': { renderType: 'choice' },
      'Multiple Choice (Multiple Answers)': { renderType: 'choice' },
      'Headings Matching': { renderType: 'headings' },
    };
    return templates[type] || { renderType: 'choice' };
  }
}
