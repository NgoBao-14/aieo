import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PreparedGroup } from '../../../practice-detail.models';

@Component({
  selector: 'app-listening-input-group',
  templateUrl: './listening-input-group.component.html',
  styleUrls: ['./listening-input-group.component.scss']
})
export class ListeningInputGroupComponent {
  @Input() group!: PreparedGroup;
  @Input() answers: Record<string, string> = {};
  @Output() answerChange = new EventEmitter<{ id: number; value: string }>();

  trackByQuestion(_: number, question: { id: number }): number {
    return question.id;
  }
}
