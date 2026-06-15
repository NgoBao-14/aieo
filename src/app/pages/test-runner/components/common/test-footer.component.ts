import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TestPart } from '../../../../models/app.models';

@Component({
  selector: 'app-test-footer',
  template: `
    <footer class="test-shell-footer">
      <div class="test-shell-footer__parts">
        <div
          *ngFor="let part of parts; let i = index; trackBy: trackByPart"
          class="test-shell-footer__part"
          [class.is-active]="currentPartIndex === i"
          (click)="selectPart.emit(i)"
        >
          <div class="test-shell-footer__part-line" *ngIf="currentPartIndex === i"></div>
          <span class="test-shell-footer__part-label">{{ partLabel }} {{ part.number || (i + 1) }}</span>

          <div class="test-shell-footer__nav" *ngIf="currentPartIndex === i; else inactiveMeta">
            <button
              *ngFor="let questionId of getQuestionNumbersForPart(part); trackBy: trackById"
              type="button"
              class="test-shell-footer__q"
              [class.is-current]="activeQuestion === questionId"
              [class.is-answered]="isAnswered(questionId)"
              (click)="setActiveQuestion.emit(questionId); $event.stopPropagation()"
            >
              {{ questionId }}
            </button>
          </div>

          <ng-template #inactiveMeta>
            <span class="test-shell-footer__meta">
              {{ getAnsweredCountForPart(part) }} / {{ getQuestionNumbersForPart(part).length }}
            </span>
          </ng-template>
        </div>
      </div>

      <button type="button" class="test-shell-footer__submit" (click)="submitTest.emit()">✓</button>
    </footer>
  `
})
export class TestFooterComponent {
  @Input() parts: TestPart[] = [];
  @Input() currentPartIndex = 0;
  @Input() activeQuestion = 1;
  @Input() answers: Record<string, string> = {};
  @Input() partLabel = 'Part';
  @Output() selectPart = new EventEmitter<number>();
  @Output() setActiveQuestion = new EventEmitter<number>();
  @Output() submitTest = new EventEmitter<void>();

  getQuestionNumbersForPart(part: TestPart): number[] {
    return part.questionGroups
      .flatMap((group) => group.questions.map((question) => question.id))
      .sort((a, b) => a - b);
  }

  getAnsweredCountForPart(part: TestPart): number {
    return this.getQuestionNumbersForPart(part).filter((id) => this.isAnswered(id)).length;
  }

  isAnswered(questionId: number): boolean {
    return !!this.answers[String(questionId)]?.trim();
  }

  trackByPart(_: number, part: TestPart): string {
    return part.id;
  }

  trackById(_: number, id: number): number {
    return id;
  }
}
