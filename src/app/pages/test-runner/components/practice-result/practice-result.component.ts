import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Submission, Test } from '../../../../models/app.models';

interface QuestionTypeStat {
  type: string;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
}

@Component({
  selector: 'app-practice-result',
  templateUrl: './practice-result.component.html',
  styleUrls: ['./practice-result.component.scss']
})
export class PracticeResultComponent implements OnInit {
  @Input() submission!: Submission;
  @Input() test!: Test;
  @Input() timeSpent = 0;

  @Output() review = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  stats: QuestionTypeStat[] = [];
  correctCount = 0;
  wrongCount = 0;
  skippedCount = 0;
  totalQuestions = 0;

  ngOnInit(): void {
    this.calculateStats();
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  }

  get strokeDashOffset(): number {
    if (this.totalQuestions === 0) {
      return 251.2; // Circumference for r=40
    }
    const percent = this.correctCount / this.totalQuestions;
    return 251.2 * (1 - percent);
  }

  private calculateStats(): void {
    if (!this.test || !this.submission) {
      return;
    }

    const answers = this.submission.answers || {};
    const answerKey = this.test.answerKey || {};
    const typeMap: Record<string, QuestionTypeStat> = {};

    this.test.parts.forEach((part) => {
      part.questionGroups.forEach((group) => {
        group.questions.forEach((question) => {
          const qType = question.type || group.type || 'Other';
          const expected = (answerKey[String(question.id)] ?? '').trim().toLowerCase();
          const actual = (answers[String(question.id)] ?? '').trim().toLowerCase();

          const isCorrect = actual === expected && expected !== '';
          const isSkipped = !actual;

          if (!typeMap[qType]) {
            typeMap[qType] = {
              type: qType,
              total: 0,
              correct: 0,
              wrong: 0,
              skipped: 0
            };
          }

          typeMap[qType].total += 1;
          this.totalQuestions += 1;

          if (isCorrect) {
            typeMap[qType].correct += 1;
            this.correctCount += 1;
          } else if (isSkipped) {
            typeMap[qType].skipped += 1;
            this.skippedCount += 1;
          } else {
            typeMap[qType].wrong += 1;
            this.wrongCount += 1;
          }
        });
      });
    });

    this.stats = Object.values(typeMap);
  }
}
