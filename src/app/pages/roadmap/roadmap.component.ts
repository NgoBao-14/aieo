import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LearningSession, SessionService } from '../../core/services/session.service';
import { ProgressService, UserProgress } from '../../core/services/progress.service';

interface PhaseData {
  phase: number;
  label: string;
  bandTarget: string;
  color: string;
  sessions: LearningSession[];
  expanded: boolean;
  completedCount: number;
  totalCount: number;
  isActive: boolean;
  isLocked: boolean;
}

@Component({
  selector: 'app-roadmap',
  templateUrl: './roadmap.component.html',
  styleUrls: ['./roadmap.component.scss']
})
export class RoadmapComponent implements OnInit {
  phases: PhaseData[] = [];
  progress!: UserProgress;
  allSessions: LearningSession[] = [];
  loading = true;

  readonly TOTAL = 180;

  constructor(
    private sessionService: SessionService,
    private progressService: ProgressService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.progress = this.progressService.getProgress();
    this.allSessions = await firstValueFrom(this.sessionService.getSessions());
    this.buildPhases();
    this.loading = false;
  }

  private buildPhases(): void {
    const phaseMeta = [
      { phase: 1, label: 'Foundation',  bandTarget: '4.0 → 4.5', color: '#6366F1', start: 1,   end: 30  },
      { phase: 2, label: 'Building',    bandTarget: '4.5 → 5.5', color: '#0EA5E9', start: 31,  end: 90  },
      { phase: 3, label: 'Developing',  bandTarget: '5.5 → 6.0', color: '#10B981', start: 91,  end: 150 },
      { phase: 4, label: 'Targeting',   bandTarget: '6.0 → 6.5', color: '#F59E0B', start: 151, end: 180 },
    ];

    this.phases = phaseMeta.map(meta => {
      const sessions = this.allSessions.filter(s => s.phase === meta.phase);
      const completedCount = sessions.filter(s => this.progress.completedSessions[s.id]?.passed).length;
      const currentPhase = this.getCurrentPhase();
      const isActive = meta.phase === currentPhase;
      // Phase locked if previous phase test not passed
      const prevPhaseTestId = meta.phase === 1 ? 0 : [0, 30, 90, 150][meta.phase - 1];
      const isLocked = meta.phase > 1 && !this.progress.completedSessions[prevPhaseTestId]?.passed;

      return {
        ...meta,
        sessions,
        expanded: isActive,
        completedCount,
        totalCount: sessions.length,
        isActive,
        isLocked
      };
    });
  }

  private getCurrentPhase(): number {
    const id = this.progress.currentSessionId;
    if (id <= 30) return 1;
    if (id <= 90) return 2;
    if (id <= 150) return 3;
    return 4;
  }

  get overallProgress(): number {
    const passed = Object.values(this.progress.completedSessions).filter(s => s.passed).length;
    return Math.round((passed / this.TOTAL) * 100);
  }

  get completedCount(): number {
    return Object.values(this.progress.completedSessions).filter(s => s.passed).length;
  }

  togglePhase(phase: PhaseData): void {
    phase.expanded = !phase.expanded;
  }

  sessionState(session: LearningSession): 'done' | 'active' | 'locked' | 'failed' {
    const prog = this.progress.completedSessions[session.id];
    if (prog?.passed) return 'done';
    if (prog && !prog.passed) return 'failed';
    if (session.id === this.progress.currentSessionId) return 'active';
    if (session.id < this.progress.currentSessionId) return 'failed';
    return 'locked';
  }

  canEnter(session: LearningSession): boolean {
    return session.id <= this.progress.currentSessionId;
  }

  goToSession(session: LearningSession): void {
    if (!this.canEnter(session)) return;
    this.router.navigate(['/roadmap', session.id]);
  }

  skillIcon(skill: string): string {
    if (skill === 'Reading') return '📖';
    if (skill === 'Listening') return '🎧';
    if (skill === 'Vocabulary') return '📚';
    if (skill === 'Both') return '📝';
    return '📝';
  }
}
