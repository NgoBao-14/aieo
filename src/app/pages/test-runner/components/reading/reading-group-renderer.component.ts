import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PreparedGroup } from '../../practice-detail.models';

@Component({
  selector: 'app-reading-group-renderer',
  template: `
    <div class="groupList">
      <section class="qGroup" *ngFor="let group of groups; trackBy: trackByGroup">
        <div class="groupHeader">
          <div class="instructionBox">
            <div class="instructionMeta">
              <div class="instructionRange">Questions {{ group.raw.range }}</div>
              <div class="instructionType">{{ group.raw.type }}</div>
            </div>
            <p class="instructionText">{{ group.raw.instructions }}</p>
          </div>
        </div>

        <div class="qBlock">
          <app-reading-template-group
            *ngIf="group.mode === 'template'"
            [group]="group"
            [answers]="answers"
            (answerChange)="answerChange.emit($event)"
            (dragValueStart)="dragValueStart.emit($event)"
            (dragValueEnd)="dragValueEnd.emit($event)"
          ></app-reading-template-group>

          <app-reading-grid-group
            *ngIf="group.mode === 'grid'"
            [group]="group"
            [answers]="answers"
            (answerChange)="answerChange.emit($event)"
          ></app-reading-grid-group>

          <app-reading-headings-group
            *ngIf="group.mode === 'headings'"
            [group]="group"
            (dragValueStart)="dragValueStart.emit($event)"
            (dragValueEnd)="dragValueEnd.emit($event)"
          ></app-reading-headings-group>

          <app-reading-multi-select-group
            *ngIf="group.mode === 'multi-select'"
            [group]="group"
            [answers]="answers"
            (answerChange)="answerChange.emit($event)"
          ></app-reading-multi-select-group>

          <app-reading-choice-group
            *ngIf="group.mode === 'choice'"
            [group]="group"
            [answers]="answers"
            (answerChange)="answerChange.emit($event)"
          ></app-reading-choice-group>

          <app-reading-input-group
            *ngIf="group.mode === 'input'"
            [group]="group"
            [answers]="answers"
            (answerChange)="answerChange.emit($event)"
          ></app-reading-input-group>
        </div>
      </section>
    </div>
  `
})
export class ReadingGroupRendererComponent {
  @Input() groups: PreparedGroup[] = [];
  @Input() answers: Record<string, string> = {};
  @Output() answerChange = new EventEmitter<{ id: number; value: string }>();
  @Output() dragValueStart = new EventEmitter<string>();
  @Output() dragValueEnd = new EventEmitter<DragEvent>();

  trackByGroup(_: number, group: PreparedGroup): string {
    return group.raw.id;
  }
}
