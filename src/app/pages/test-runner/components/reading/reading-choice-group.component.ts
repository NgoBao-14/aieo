import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PreparedGroup } from '../../practice-detail.models';
import { Question } from '../../../../models/app.models';

@Component({
  selector: 'app-reading-choice-group',
  template: `
    <div class="questionItemStack">
      <div class="questionItem" *ngFor="let question of group.raw.questions; trackBy: trackByQuestion" [id]="'q-box-' + question.id">
        <div class="qHeaderRow">
          <span class="gapCircle">{{ question.id }}</span>
          <p class="qText">{{ question.text || ('Question ' + question.id) }}</p>
        </div>

        <div class="tfngRow" *ngIf="useCompactButtons(question)">
          <button
            *ngFor="let option of getOptions(question); let i = index; trackBy: trackByOption"
            type="button"
            class="tfngBtn"
            [class.tfngBtnActive]="isSelected(question.id, option, i)"
            (click)="answerChange.emit({ id: question.id, value: getChoiceValue(option, i) })"
          >
            {{ option }}
          </button>
        </div>

        <div class="mcqOptionsList" *ngIf="!useCompactButtons(question)">
          <button
            type="button"
            class="mcqOption"
            *ngFor="let option of getOptions(question); let i = index; trackBy: trackByOption"
            [class.mcqOptionSelected]="isSelected(question.id, option, i)"
            (click)="answerChange.emit({ id: question.id, value: getChoiceValue(option, i) })"
          >
            <div class="mcqLetter" [class.mcqLetterSelected]="isSelected(question.id, option, i)">
              {{ getOptionLetter(option, i) }}
            </div>
            <span class="mcqText">{{ getOptionText(option) }}</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class ReadingChoiceGroupComponent {
  @Input() group!: PreparedGroup;
  @Input() answers: Record<string, string> = {};
  @Output() answerChange = new EventEmitter<{ id: number; value: string }>();

  getOptions(question: Question): string[] {
    return question.options?.length ? question.options : (this.group.raw.options ?? []);
  }

  useCompactButtons(question: Question): boolean {
    return !question.options?.length && this.getOptions(question).length > 0 && this.getOptions(question).length <= 4;
  }

  isSelected(questionId: number, option: string, index: number): boolean {
    const actual = this.answers[String(questionId)] ?? '';
    const expected = this.getChoiceValue(option, index);
    return actual === expected || actual === option;
  }

  getChoiceValue(option: string, index: number): string {
    return this.isBooleanType() ? option : this.getOptionLetter(option, index);
  }

  getOptionLetter(option: string, index: number): string {
    return option.trim().match(/^([A-Z])(?:[\.\)]|\s{1,2})\s*/)?.[1] ?? String.fromCharCode(65 + index);
  }

  getOptionText(option: string): string {
    return option.trim().replace(/^([A-Z])(?:[\.\)]|\s{1,2})\s*/, '');
  }

  trackByQuestion(_: number, question: { id: number }): number {
    return question.id;
  }

  trackByOption(_: number, option: string): string {
    return option;
  }

  private isBooleanType(): boolean {
    return ['True - False - Not Given', 'Yes - No - Not Given'].includes(this.group.raw.type);
  }
}
