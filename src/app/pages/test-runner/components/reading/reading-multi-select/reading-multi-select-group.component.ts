import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PreparedGroup } from '../../../practice-detail.models';

@Component({
  selector: 'app-reading-multi-select-group',
  templateUrl: './reading-multi-select-group.component.html',
  styleUrls: ['./reading-multi-select-group.component.scss']
})
export class ReadingMultiSelectGroupComponent {
  @Input() group!: PreparedGroup;
  @Input() answers: Record<string, string> = {};
  @Output() answerChange = new EventEmitter<{ id: number; value: string }>();

  isSelected(option: string): boolean {
    return this.group.raw.questions.some((question) => this.answers[String(question.id)] === option);
  }

  toggleOption(option: string): void {
    const ids = this.group.raw.questions.map((question) => question.id);
    const selected = ids.map((id) => this.answers[String(id)]).filter(Boolean);
    const selectionLimit = Math.min(2, ids.length);

    if (selected.includes(option)) {
      const idToClear = ids.find((id) => this.answers[String(id)] === option);
      if (idToClear) {
        this.answerChange.emit({ id: idToClear, value: '' });
      }
      return;
    }

    if (selected.length < selectionLimit) {
      const idToSet = ids.find((id) => !this.answers[String(id)]);
      if (idToSet) {
        this.answerChange.emit({ id: idToSet, value: option });
      }
    }
  }

  getChoiceValue(option: string, index: number): string {
    return this.getOptionLetter(option, index);
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
}
