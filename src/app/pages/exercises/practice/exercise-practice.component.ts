import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { QuestionGroup, Test, TestPart } from '../../../models/app.models';
import { TestDataService } from '../../../core/services/test-data.service';

export interface PracticeQuestion {
  id: number;
  text?: string;
  options?: string[];
  groupType: string;
  groupInstructions: string;
  template?: string;
  headings?: string[];
  columns?: string[];
  passageHtml?: string;
  audioUrl?: string;
  partTitle: string;
}

export interface PracticeResult {
  questionId: number;
  correct: boolean;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
}

@Component({
  selector: 'app-exercise-practice',
  templateUrl: './exercise-practice.component.html',
  styleUrls: ['./exercise-practice.component.scss']
})
export class ExercisePracticeComponent implements OnInit {
  skill: 'Reading' | 'Listening' = 'Reading';
  typeSlug = '';
  typeName = '';

  questions: PracticeQuestion[] = [];
  answerKey: Record<string, string> = {};
  explanations: Record<string, string> = {};
  loading = true;
  submitted = false;

  // current question mode
  currentIndex = 0;
  answers: Record<number, string> = {};
  results: PracticeResult[] = [];

  // group context for current question
  get currentQ(): PracticeQuestion | null { return this.questions[this.currentIndex] ?? null; }
  get totalQ(): number { return this.questions.length; }
  get answered(): number { return Object.keys(this.answers).length; }
  get score(): number { return this.results.filter(r => r.correct).length; }
  get percent(): number { return Math.round((this.score / this.totalQ) * 100); }

  // band estimate from score ratio
  get bandEstimate(): string {
    const p = this.percent;
    if (p >= 90) return '8.5–9.0';
    if (p >= 78) return '7.5–8.0';
    if (p >= 65) return '6.5–7.0';
    if (p >= 52) return '5.5–6.0';
    if (p >= 38) return '4.5–5.0';
    return '4.0–4.5';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private testDataService: TestDataService
  ) {}

  async ngOnInit(): Promise<void> {
    const skillParam = this.route.snapshot.paramMap.get('skill') ?? '';
    const typeParam  = this.route.snapshot.paramMap.get('type')  ?? '';

    this.skill    = skillParam === 'listening' ? 'Listening' : 'Reading';
    this.typeSlug = typeParam;

    await this.loadQuestions();
  }

  private slugToType(slug: string): string {
    // reverse the slug from goToExercise() — lowercase + replace spaces with '-'
    const map: Record<string, string> = {
      'true---false---not-given':       'True - False - Not Given',
      'true--false--not-given':         'True - False - Not Given',
      'note-completion':                'Note Completion',
      'multiple-choice':                'Multiple Choice',
      'form-completion':                'Form Completion',
      'matching-headings':              'Matching Headings',
      'yes---no---not-given':           'Yes - No - Not Given',
      'sentence-completion':            'Sentence Completion',
      'summary-completion':             'Summary Completion',
      'table-completion':               'Table Completion',
      'flow-chart-completion':          'Flow-chart Completion',
      'map---plan-labelling':           'Map / Plan Labelling',
      'short-answer':                   'Short Answer Questions',
      'matching':                       'Matching',
    };
    return map[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  private async loadQuestions(): Promise<void> {
    this.loading = true;
    this.typeName = this.slugToType(this.typeSlug);

    const tests = await firstValueFrom(this.testDataService.getTests({ skill: this.skill }));

    this.questions   = [];
    this.answerKey   = {};
    this.explanations = {};

    for (const test of tests) {
      for (const part of test.parts) {
        for (const group of part.questionGroups ?? []) {
          if (group.type !== this.typeName) continue;

          for (const q of group.questions) {
            this.questions.push({
              id:                q.id,
              text:              q.text,
              options:           q.options,
              groupType:         group.type,
              groupInstructions: group.instructions,
              template:          group.template,
              headings:          group.headings,
              columns:           group.columns,
              passageHtml:       part.passageHtml,
              audioUrl:          part.audioUrl,
              partTitle:         part.title,
            });

            if (test.answerKey?.[q.id]) {
              this.answerKey[q.id] = test.answerKey[q.id];
            }
            if ((test as any).explanations?.[q.id]) {
              this.explanations[q.id] = (test as any).explanations[q.id];
            }
          }
        }
      }
    }

    this.loading = false;

    if (!this.questions.length) {
      // No questions found for this type - stay on page with empty state
    }
  }

  setAnswer(questionId: number, value: string): void {
    this.answers[questionId] = value;
  }

  getAnswer(questionId: number): string {
    return this.answers[questionId] ?? '';
  }

  next(): void {
    if (this.currentIndex < this.totalQ - 1) {
      this.currentIndex++;
    }
  }

  prev(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  goTo(index: number): void {
    this.currentIndex = index;
  }

  submit(): void {
    this.results = this.questions.map(q => {
      const userAnswer    = (this.answers[q.id] ?? '').trim().toLowerCase();
      const correctAnswer = (this.answerKey[q.id] ?? '').trim().toLowerCase();
      return {
        questionId:    q.id,
        correct:       userAnswer === correctAnswer,
        userAnswer:    this.answers[q.id] ?? '',
        correctAnswer: this.answerKey[q.id] ?? '(chưa có đáp án)',
        explanation:   this.explanations[q.id],
      };
    });
    this.submitted = true;
    this.currentIndex = 0;
  }

  retry(): void {
    this.answers = {};
    this.results = [];
    this.submitted = false;
    this.currentIndex = 0;
  }

  backToHub(): void {
    this.router.navigate(['/exercises']);
  }
}
