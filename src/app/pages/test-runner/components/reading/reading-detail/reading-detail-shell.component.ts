import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Test, TestPart } from '../../../../../models/app.models';
import { PreparedGroup } from '../../../practice-detail.models';

@Component({
  selector: 'app-reading-detail-shell',
  templateUrl: './reading-detail-shell.component.html',
  styleUrls: ['./reading-detail-shell.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ReadingDetailShellComponent {
  @Input() test: Test | null = null;
  @Input() activePart: TestPart | null = null;
  @Input() activePartIndex = 0;
  @Input() activeGroups: PreparedGroup[] = [];
  @Input() answers: Record<string, string> = {};
  @Input() renderedPassageHtml = '';
  @Input() leftWidth = 52;
  @Input() currentQId = 1;
  @Input() allQuestionIds: number[] = [];
  @Input() partRanges: Array<{ min: number; max: number; total: number }> = [];
  @Input() partProgress: Record<string, { filled: number; total: number }> = {};
  @Input() canGoPrevious = false;
  @Input() canGoNext = false;

  @Output() partChange = new EventEmitter<number>();
  @Output() answerChange = new EventEmitter<{ id: number; value: string }>();
  @Output() questionNavigate = new EventEmitter<number>();
  @Output() resizeStart = new EventEmitter<MouseEvent | TouchEvent>();
  @Output() passageMouseUp = new EventEmitter<void>();
  @Output() passageDragOver = new EventEmitter<DragEvent>();
  @Output() passageDragLeave = new EventEmitter<DragEvent>();
  @Output() passageDrop = new EventEmitter<DragEvent>();
  @Output() passageClick = new EventEmitter<MouseEvent>();
  @Output() hideHighlight = new EventEmitter<void>();
  @Output() dragValueStart = new EventEmitter<string>();
  @Output() dragValueEnd = new EventEmitter<DragEvent>();
  @Output() previousQuestion = new EventEmitter<void>();
  @Output() nextQuestion = new EventEmitter<void>();
  @Output() submitRequested = new EventEmitter<void>();

  getPartPrompt(): string {
    const range = this.partRanges[this.activePartIndex];
    if (!range) {
      return '';
    }

    return `Read the text and answer questions ${range.min}-${range.max}`;
  }

  getPaneTitle(): string {
    return `Reading Passage ${this.activePart?.number ?? 1}`;
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

  getAnswer(questionId: number): string {
    return this.answers[String(questionId)] ?? '';
  }

  trackByPart(_: number, part: TestPart): string {
    return part.id;
  }

  trackById(_: number, value: number): number {
    return value;
  }
}
