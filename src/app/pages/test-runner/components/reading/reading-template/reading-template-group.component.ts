import { Component, EventEmitter, Input, Output } from '@angular/core';
import { QuestionGroup } from '../../../../../models/app.models';
import { PreparedGroup } from '../../../practice-detail.models';

@Component({
  selector: 'app-reading-template-group',
  templateUrl: './reading-template-group.component.html',
  styleUrls: ['./reading-template-group.component.scss']
})
export class ReadingTemplateGroupComponent {
  @Input() group!: PreparedGroup;
  @Input() answers: Record<string, string> = {};
  @Output() answerChange = new EventEmitter<{ id: number; value: string }>();
  @Output() dragValueStart = new EventEmitter<string>();
  @Output() dragValueEnd = new EventEmitter<DragEvent>();

  getAnswer(questionId: number): string {
    return this.answers[String(questionId)] ?? '';
  }

  isDragDrop(group: QuestionGroup): boolean {
    return group.type === 'Matching Sentence Endings' || group.interaction === 'drag-drop';
  }

  getChoiceValue(option: string, index: number): string {
    return this.getOptionLetter(option, index);
  }

  getDisplay(questionId: number): string {
    const value = this.getAnswer(questionId);
    if (!value) {
      return this.group.raw.type === 'Matching Sentence Endings' ? 'Drop here' : 'Drop answer here';
    }

    const match = (this.group.raw.options ?? []).find((option, index) => this.getOptionLetter(option, index) === value);
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
    const value = event.dataTransfer?.getData('text/plain') || '';
    if (value) {
      this.answerChange.emit({ id: questionId, value });
    }
  }

  startDrag(event: DragEvent, value: string): void {
    this.dragValueStart.emit(value);
    document.documentElement.setAttribute('data-ielts-drag-value', value);
    event.dataTransfer?.setData('text/plain', value);
    event.dataTransfer?.setData('text', value);
    event.dataTransfer?.setData('application/id', value);
    event.dataTransfer?.setData('application/ielts-type', 'Reading');
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
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
