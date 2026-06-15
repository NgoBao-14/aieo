import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PreparedGroup } from '../../practice-detail.models';

@Component({
  selector: 'app-reading-input-group',
  template: `
    <div class="questionItemStack">
      <div class="questionItem" *ngFor="let question of group.raw.questions; trackBy: trackByQuestion" [id]="'q-box-' + question.id">
        <div class="qHeaderRow">
          <span class="gapCircle">{{ question.id }}</span>
          <p class="qText">{{ question.text || ('Question ' + question.id) }}</p>
        </div>

        <div class="inputContainer inputContainerBlock">
          <input
            type="text"
            class="inlineInput blockInput"
            [ngModel]="answers['' + question.id] || ''"
            (ngModelChange)="answerChange.emit({ id: question.id, value: $event })"
          />
        </div>
      </div>
    </div>
  `
})
export class ReadingInputGroupComponent {
  @Input() group!: PreparedGroup;
  @Input() answers: Record<string, string> = {};
  @Output() answerChange = new EventEmitter<{ id: number; value: string }>();

  trackByQuestion(_: number, question: { id: number }): number {
    return question.id;
  }
}
