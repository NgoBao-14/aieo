import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-test-header',
  template: `
    <header class="test-shell-header">
      <div class="test-shell-header__left">
        <span class="test-shell-header__brand">IELTS</span>
        <span class="test-shell-header__sep">|</span>
        <span class="test-shell-header__title">{{ book }} - {{ title }}</span>
      </div>

      <div class="test-shell-header__right">
        <div class="test-shell-header__timer" [class.is-warning]="timeLeft < 300">
          <span class="test-shell-header__timer-icon">◷</span>
          <span class="test-shell-header__timer-value">{{ formatTime(timeLeft) }}</span>
        </div>

        <button type="button" class="test-shell-header__exit" (click)="goBack.emit()">
          Thoát
        </button>
      </div>
    </header>
  `
})
export class TestHeaderComponent {
  @Input() book = 'IELTS9s';
  @Input() title = '';
  @Input() timeLeft = 0;
  @Output() goBack = new EventEmitter<void>();

  formatTime(time: number): string {
    const m = Math.floor(time / 60);
    const s = time % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}
