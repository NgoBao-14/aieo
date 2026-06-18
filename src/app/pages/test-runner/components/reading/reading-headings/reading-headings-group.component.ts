import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PreparedGroup } from '../../../practice-detail.models';

@Component({
  selector: 'app-reading-headings-group',
  templateUrl: './reading-headings-group.component.html',
  styleUrls: ['./reading-headings-group.component.scss']
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
