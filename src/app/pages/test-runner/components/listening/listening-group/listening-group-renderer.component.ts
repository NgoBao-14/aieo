import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PreparedGroup } from '../../../practice-detail.models';

@Component({
  selector: 'app-listening-group-renderer',
  templateUrl: './listening-group-renderer.component.html',
  styleUrls: ['./listening-group-renderer.component.scss']
})
export class ListeningGroupRendererComponent {
  @Input() groups: PreparedGroup[] = [];
  @Input() answers: Record<string, string> = {};
  @Input() currentQId = 1;
  @Output() answerChange = new EventEmitter<{ id: number; value: string }>();

  trackByGroup(_: number, group: PreparedGroup): string {
    return group.raw.id;
  }
}
