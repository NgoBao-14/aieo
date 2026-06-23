import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PreparedGroup } from '../../../practice-detail.models';

@Component({
  selector: 'app-reading-grid-group',
  templateUrl: './reading-grid-group.component.html',
  styleUrls: ['./reading-grid-group.component.scss']
})
export class ReadingGridGroupComponent {
  @Input() group!: PreparedGroup;
  @Input() answers: Record<string, string> = {};
  @Input() currentQId = 1;
  @Output() answerChange = new EventEmitter<{ id: number; value: string }>();

  getAnswer(questionId: number): string {
    return this.answers[String(questionId)] ?? '';
  }

  trackByQuestion(_: number, question: { id: number }): number {
    return question.id;
  }
}
