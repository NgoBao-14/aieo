import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { LearningSession, SessionService } from '../../../core/services/session.service';
import { ProgressService } from '../../../core/services/progress.service';

type Step = 'theory' | 'practice' | 'complete';

@Component({
  selector: 'app-session-detail',
  templateUrl: './session-detail.component.html',
  styleUrls: ['./session-detail.component.scss']
})
export class SessionDetailComponent implements OnInit {
  session: LearningSession | null = null;
  loading = true;
  step: Step = 'theory';
  lastScore = 0;
  lastPassed = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService,
    private progressService: ProgressService,
    private sanitizer: DomSanitizer
  ) {}

  get safeTheoryHtml(): SafeHtml | null {
    if (!this.session?.theoryHtml) return null;
    return this.sanitizer.bypassSecurityTrustHtml(this.session.theoryHtml);
  }

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const sessions = await firstValueFrom(this.sessionService.getSessions());
    this.session = sessions.find(s => s.id === id) ?? null;

    if (!this.session) {
      this.router.navigate(['/roadmap']);
      return;
    }

    // Skip theory step nếu buổi không có bài giảng
    if (!this.session.hasTheory) {
      this.step = 'practice';
      // Nếu không có tasks (buổi lý thuyết thuần), tự complete
      if (!this.session.tasks.length) {
        this.completeSession(100);
        return;
      }
    }

    // Nếu chỉ có lý thuyết, không có tasks → step = theory only
    if (this.session.hasTheory && !this.session.tasks.length) {
      this.step = 'theory';
    }

    this.loading = false;
  }

  get firstTask() {
    return this.session?.tasks?.[0] ?? null;
  }

  get exerciseRoute(): string[] | null {
    const task = this.firstTask;
    if (!task || task.type !== 'exercise') return null;
    return ['/exercises', task.skill ?? 'reading', this.sessionService.typeToSlug(task.exerciseType ?? '')];
  }

  get vocabularyRoute(): string[] | null {
    const task = this.firstTask;
    if (!task || task.type !== 'vocabulary') return null;
    return ['/vocabulary'];
  }

  startTheory(): void {
    this.step = 'theory';
  }

  finishTheory(): void {
    if (!this.session) return;
    if (!this.session.tasks.length) {
      // Buổi lý thuyết thuần → complete ngay
      this.completeSession(100);
    } else {
      this.step = 'practice';
    }
  }

  // Gọi từ nút sau khi làm bài xong (tạm thời user tự báo kết quả)
  finishPractice(scorePercent: number): void {
    this.completeSession(scorePercent);
  }

  private completeSession(scorePercent: number): void {
    if (!this.session) return;
    const passed = this.progressService.completeSession(
      this.session.id,
      scorePercent,
      this.session.minAccuracy
    );
    this.lastScore = scorePercent;
    this.lastPassed = passed;
    this.step = 'complete';
    this.loading = false;
  }

  goNextSession(): void {
    if (!this.session) return;
    this.router.navigate(['/roadmap', this.session.id + 1]);
  }

  retrySession(): void {
    this.step = this.session?.hasTheory ? 'theory' : 'practice';
    this.lastScore = 0;
    this.lastPassed = false;
  }

  goRoadmap(): void {
    this.router.navigate(['/roadmap']);
  }

  skillIcon(skill: string): string {
    if (skill === 'Reading') return '📖';
    if (skill === 'Listening') return '🎧';
    if (skill === 'Vocabulary') return '📚';
    return '📝';
  }
}
