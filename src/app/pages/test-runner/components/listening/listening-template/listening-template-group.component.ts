import { Component, EventEmitter, Input, Output } from '@angular/core';
import { QuestionGroup } from '../../../../../models/app.models';
import { PreparedGroup } from '../../../practice-detail.models';

@Component({
  selector: 'app-listening-template-group',
  templateUrl: './listening-template-group.component.html',
  styleUrls: ['./listening-template-group.component.scss']
})
export class ListeningTemplateGroupComponent {
  @Input() group!: PreparedGroup;
  @Input() answers: Record<string, string> = {};
  @Output() answerChange = new EventEmitter<{ id: number; value: string }>();

  getAnswer(questionId: number): string {
    return this.answers[String(questionId)] ?? '';
  }

  isDragDrop(group: QuestionGroup): boolean {
    return group.interaction === 'drag-drop';
  }

  getChoiceValue(option: string, index: number): string {
    return this.getOptionLetter(option, index);
  }

  getDisplay(questionId: number): string {
    const value = this.getAnswer(questionId);
    if (!value) {
      return 'Drop answer here';
    }

    const match = (this.group.raw.options ?? []).find((option: string, index: number) => this.getOptionLetter(option, index) === value);
    return match ? `${value}. ${this.getOptionText(match)}` : value;
  }

  allowDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, questionId: number): void {
    event.preventDefault();
    const value = event.dataTransfer?.getData('text/plain') ?? '';
    if (value) {
      this.answerChange.emit({ id: questionId, value });
    }
  }

  startDrag(event: DragEvent, value: string): void {
    event.dataTransfer?.setData('text/plain', value);
    event.dataTransfer?.setData('application/id', value);
    event.dataTransfer?.setData('application/ielts-type', 'Listening');
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  trackByOption(_: number, option: string): string {
    return option;
  }

  private getOptionLetter(option: string, index: number): string {
    return option.trim().match(/^([A-Z])(?:[\.\)]|\s{1,2})\s*/)?.[1] ?? String.fromCharCode(65 + index);
  }

  private getOptionText(option: string): string {
    return option.trim().replace(/^([A-Z])(?:[\.\)]|\s{1,2})\s*/, '');
  }
}
