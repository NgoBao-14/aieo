import { Component, ElementRef, Input, ViewChild } from '@angular/core';

@Component({
  selector: 'app-audio-player',
  template: `
    <div class="test-shell-audio" *ngIf="audioUrl">
      <div class="test-shell-audio__inner">
        <audio #audioPlayer [src]="audioUrl" (timeupdate)="onTimeUpdate()" (loadedmetadata)="onLoadedMetadata()" (ended)="isPlaying = false"></audio>

        <button type="button" class="test-shell-audio__play" (click)="togglePlay()">
          {{ isPlaying ? '❚❚' : '▶' }}
        </button>

        <div class="test-shell-audio__time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</div>

        <div class="test-shell-audio__progress" (click)="seek($event)">
          <div class="test-shell-audio__progress-track">
            <div class="test-shell-audio__progress-fill" [style.width.%]="duration ? (currentTime / duration) * 100 : 0"></div>
          </div>
        </div>

        <button type="button" class="test-shell-audio__speed" (click)="cycleSpeed()">Tốc độ: {{ playbackRate }}x</button>
      </div>
    </div>
  `
})
export class AudioPlayerComponent {
  @Input() audioUrl: string | null | undefined = null;
  @ViewChild('audioPlayer') audioPlayer?: ElementRef<HTMLAudioElement>;

  isPlaying = false;
  currentTime = 0;
  duration = 0;
  playbackRate = 1;

  togglePlay(): void {
    const audio = this.audioPlayer?.nativeElement;
    if (!audio) {
      return;
    }

    if (this.isPlaying) {
      audio.pause();
      this.isPlaying = false;
      return;
    }

    void audio.play();
    this.isPlaying = true;
  }

  onTimeUpdate(): void {
    const audio = this.audioPlayer?.nativeElement;
    if (!audio) {
      return;
    }

    this.currentTime = audio.currentTime;
  }

  onLoadedMetadata(): void {
    const audio = this.audioPlayer?.nativeElement;
    if (!audio) {
      return;
    }

    this.duration = audio.duration;
  }

  seek(event: MouseEvent): void {
    const audio = this.audioPlayer?.nativeElement;
    if (!audio) {
      return;
    }

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * this.duration;
    this.currentTime = audio.currentTime;
  }

  cycleSpeed(): void {
    const audio = this.audioPlayer?.nativeElement;
    if (!audio) {
      return;
    }

    const rates = [0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(this.playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    this.playbackRate = nextRate;
    audio.playbackRate = nextRate;
  }

  formatTime(seconds: number): string {
    if (!seconds || Number.isNaN(seconds)) {
      return '00:00';
    }

    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  }
}
