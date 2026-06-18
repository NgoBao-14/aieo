import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PreparedGroup } from '../../../practice-detail.models';
import { Question } from '../../../../../models/app.models';

@Component({
  selector: 'app-listening-choice-group',
  templateUrl: './listening-choice-group.component.html',
  styleUrls: ['./listening-choice-group.component.scss']
})
export class ListeningChoiceGroupComponent {
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
