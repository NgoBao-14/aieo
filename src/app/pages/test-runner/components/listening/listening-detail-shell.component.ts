import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Test, TestPart } from '../../../../models/app.models';
import { PreparedGroup } from '../../practice-detail.models';

@Component({
  selector: 'app-listening-detail-shell',
  templateUrl: './listening-detail-shell.component.html',
  styleUrls: ['./listening-detail-shell.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ListeningDetailShellComponent {
  @Input() test: Test | null = null;
  @Input() activePart: TestPart | null = null;
  @Input() activePartIndex = 0;
  @Input() activeGroups: PreparedGroup[] = [];
  @Input() answers: Record<string, string> = {};
  @Input() renderedPassageHtml = '';
  @Input() currentQId = 1;
  @Input() allQuestionIds: number[] = [];
  @Input() partRanges: Array<{ min: number; max: number; total: number }> = [];
  @Input() partProgress: Record<string, { filled: number; total: number }> = {};
  @Input() canGoPrevious = false;
  @Input() canGoNext = false;

  @Output() partChange = new EventEmitter<number>();
  @Output() answerChange = new EventEmitter<{ id: number; value: string }>();
  @Output() questionNavigate = new EventEmitter<number>();
  @Output() previousQuestion = new EventEmitter<void>();
  @Output() nextQuestion = new EventEmitter<void>();
  @Output() submitRequested = new EventEmitter<void>();

  getPartPrompt(): string {
    const range = this.partRanges[this.activePartIndex];
    if (!range) {
      return '';
    }

    return `Listen and answer questions ${range.min}-${range.max}`;
  }

  getFilledCount(part: TestPart): number {
    return this.partProgress[part.id]?.filled ?? 0;
  }

  getPartQuestionCount(part: TestPart): number {
    return this.partProgress[part.id]?.total ?? 0;
  }

  getQuestionIdsForPart(index: number): number[] {
    const range = this.partRanges[index];
    if (!range) {
      return [];
    }

    return this.allQuestionIds.filter((value) => value >= range.min && value <= range.max);
  }

  trackByPart(_: number, part: TestPart): string {
    return part.id;
  }

  trackById(_: number, value: number): number {
    return value;
  }
}
