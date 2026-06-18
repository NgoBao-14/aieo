import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PreparedGroup } from '../../../practice-detail.models';

@Component({
  selector: 'app-reading-input-group',
  templateUrl: './reading-input-group.component.html',
  styleUrls: ['./reading-input-group.component.scss']
})
export class ReadingInputGroupComponent {
  @Input() group!: PreparedGroup;
  @Input() answers: Record<string, string> = {};
  @Output() answerChange = new EventEmitter<{ id: number; value: string }>();

  trackByQuestion(_: number, question: { id: number }): number {
    return question.id;
  }
}
