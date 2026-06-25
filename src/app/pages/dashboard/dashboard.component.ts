import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ProgressService, UserProgress } from '../../core/services/progress.service';
import { SessionService, LearningSession } from '../../core/services/session.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  progress!: UserProgress;
  allSessions: LearningSession[] = [];
  todaySession: LearningSession | null = null;
  recentSessions: Array<{ session: LearningSession; prog: { score: number; passed: boolean } }> = [];
  loading = true;

  readonly TARGET_BAND = 6.5;
  readonly TOTAL_SESSIONS = 180;

  constructor(
    private progressService: ProgressService,
    private sessionService: SessionService,
    private router: Router,
    public authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    this.progress = this.progressService.getProgress();
    this.allSessions = await firstValueFrom(this.sessionService.getSessions());

    this.todaySession = this.allSessions.find(s => s.id === this.progress.currentSessionId) ?? null;

    // 3 buổi gần nhất đã học (có trong completedSessions)
    const completedIds = Object.keys(this.progress.completedSessions)
      .map(Number)
      .sort((a, b) => b - a)
      .slice(0, 3);

    this.recentSessions = completedIds
      .map(id => {
        const session = this.allSessions.find(s => s.id === id);
        const prog = this.progress.completedSessions[id];
        return session ? { session, prog } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    this.loading = false;
  }

  get completedCount(): number {
    return Object.values(this.progress.completedSessions).filter(s => s.passed).length;
  }

  get phaseProgress(): number {
    const phase = this.currentPhase;
    const phaseStart = phase === 1 ? 1 : phase === 2 ? 31 : phase === 3 ? 91 : 151;
    const phaseEnd = phase === 1 ? 30 : phase === 2 ? 90 : phase === 3 ? 150 : 180;
    const phaseTotal = phaseEnd - phaseStart + 1;
    const phaseDone = Object.keys(this.progress.completedSessions)
      .map(Number)
      .filter(id => id >= phaseStart && id <= phaseEnd && this.progress.completedSessions[id].passed)
      .length;
    return Math.round((phaseDone / phaseTotal) * 100);
  }

  get currentPhase(): number {
    const id = this.progress.currentSessionId;
    if (id <= 30) return 1;
    if (id <= 90) return 2;
    if (id <= 150) return 3;
    return 4;
  }

  get phaseLabel(): string {
    return ['', 'Foundation', 'Building', 'Developing', 'Targeting'][this.currentPhase];
  }

  get bandProgress(): number {
    return Math.round(((this.progress.bandEstimate - 4.0) / (this.TARGET_BAND - 4.0)) * 100);
  }

  goToSession(sessionId: number): void {
    this.router.navigate(['/roadmap', sessionId]);
  }

  goToRoadmap(): void {
    this.router.navigate(['/roadmap']);
  }

  skillIcon(skill: string): string {
    if (skill === 'Reading') return '📖';
    if (skill === 'Listening') return '🎧';
    if (skill === 'Vocabulary') return '📚';
    return '📝';
  }
}
