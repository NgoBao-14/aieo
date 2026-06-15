import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PreparedGroup } from '../../practice-detail.models';

@Component({
  selector: 'app-listening-grid-group',
  template: `
    <div class="gridWrapper">
      <table class="matchingTable">
        <thead>
          <tr>
            <th class="rowLabelHead"></th>
            <th *ngFor="let column of group.raw.columns" class="colHeader">{{ column }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let question of group.raw.questions; trackBy: trackByQuestion">
            <td class="gridQText">
              <span class="qIdBox">{{ question.id }}</span>
              <span class="qInner">{{ question.text }}</span>
            </td>
            <td *ngFor="let column of group.raw.columns" class="gridCell">
              <label class="radioContainer">
                <input
                  type="radio"
                  [name]="'q-' + question.id"
                  [checked]="getAnswer(question.id) === column"
                  (change)="answerChange.emit({ id: question.id, value: column })"
                />
                <span class="radioCircle"></span>
              </label>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class ListeningGridGroupComponent {
  @Input() group!: PreparedGroup;
  @Input() answers: Record<string, string> = {};
  @Output() answerChange = new EventEmitter<{ id: number; value: string }>();

  getAnswer(questionId: number): string {
    return this.answers[String(questionId)] ?? '';
  }

  trackByQuestion(_: number, question: { id: number }): number {
    return question.id;
  }
}
