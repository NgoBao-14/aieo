import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PreparedGroup } from '../../../practice-detail.models';

@Component({
  selector: 'app-reading-group-renderer',
  templateUrl: './reading-group-renderer.component.html',
  styleUrls: ['./reading-group-renderer.component.scss']
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
