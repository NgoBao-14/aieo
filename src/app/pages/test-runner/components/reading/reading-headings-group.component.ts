import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PreparedGroup } from '../../practice-detail.models';

@Component({
  selector: 'app-reading-headings-group',
  template: `
    <div class="matchingHeadingsWrapper">
      <div class="headingsList">
        <div class="headingsListTitle">List of Headings</div>
        <p class="instructions">Drag each heading pill into the matching blank in the passage on the left.</p>
        <div class="optionsPills">
        <div
          *ngFor="let heading of group.headingChoices; trackBy: trackByHeading"
          class="draggablePill"
          draggable="true"
          role="button"
          tabindex="0"
          (dragstart)="startDrag($event, heading.value)"
          (dragend)="dragValueEnd.emit($event)"
        >
          {{ heading.value }}. {{ heading.text }}
        </div>
        </div>
      </div>
    </div>
  `
})
export class ReadingHeadingsGroupComponent {
  @Input() group!: PreparedGroup;
  @Output() dragValueStart = new EventEmitter<string>();
  @Output() dragValueEnd = new EventEmitter<DragEvent>();

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

  trackByHeading(_: number, item: { value: string }): string {
    return item.value;
  }
}
