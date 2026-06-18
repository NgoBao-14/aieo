import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PreparedGroup } from '../../../practice-detail.models';

@Component({
  selector: 'app-listening-grid-group',
  templateUrl: './listening-grid-group.component.html',
  styleUrls: ['./listening-grid-group.component.scss']
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
