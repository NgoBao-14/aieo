import { Injectable } from '@angular/core';

export interface SessionProgress {
  score: number;       // percent 0–100
  passed: boolean;
  completedAt: string; // ISO string
  attempts: number;
}

export interface UserProgress {
  currentSessionId: number;
  completedSessions: Record<number, SessionProgress>;
  streak: number;
  lastStudyDate: string; // YYYY-MM-DD
  bandEstimate: number;  // 4.0–9.0
}

const PROGRESS_KEY = 'ielts9s-learning-progress';

const DEFAULT_PROGRESS: UserProgress = {
  currentSessionId: 1,
  completedSessions: {},
  streak: 0,
  lastStudyDate: '',
  bandEstimate: 4.0
};

@Injectable({ providedIn: 'root' })
export class ProgressService {

  getProgress(): UserProgress {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) return { ...DEFAULT_PROGRESS, completedSessions: {} };
      return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_PROGRESS, completedSessions: {} };
    }
  }

  saveProgress(progress: UserProgress): void {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }

  /** Gọi sau khi học viên hoàn thành một buổi. passMark = 0 => tự động đạt (buổi lý thuyết). */
  completeSession(sessionId: number, scorePercent: number, passMark: number): boolean {
    const progress = this.getProgress();
    const passed = passMark === 0 || scorePercent >= passMark;

    const existing = progress.completedSessions[sessionId];
    progress.completedSessions[sessionId] = {
      score: scorePercent,
      passed,
      completedAt: new Date().toISOString(),
      attempts: (existing?.attempts ?? 0) + 1
    };

    if (passed && sessionId >= progress.currentSessionId) {
      progress.currentSessionId = sessionId + 1;
    }

    this.updateStreak(progress);
    this.updateBand(progress);
    this.saveProgress(progress);
    return passed;
  }

  isSessionUnlocked(sessionId: number): boolean {
    return sessionId <= this.getProgress().currentSessionId;
  }

  isSessionPassed(sessionId: number): boolean {
    return this.getProgress().completedSessions[sessionId]?.passed ?? false;
  }

  /** Reset toàn bộ tiến trình (debug / placement test mới). */
  resetProgress(): void {
    localStorage.removeItem(PROGRESS_KEY);
  }

  private updateStreak(progress: UserProgress): void {
    const today = new Date().toISOString().slice(0, 10);
    if (progress.lastStudyDate === today) return;
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    progress.streak = progress.lastStudyDate === yesterday ? progress.streak + 1 : 1;
    progress.lastStudyDate = today;
  }

  private updateBand(progress: UserProgress): void {
    const passed = Object.values(progress.completedSessions).filter(s => s.passed).length;
    const ratio = Math.min(passed / 180, 1);
    // 4.0 → 6.5 linear progression
    progress.bandEstimate = Math.round((4.0 + ratio * 2.5) * 2) / 2;
  }
}
