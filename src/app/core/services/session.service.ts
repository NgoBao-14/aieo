import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

export interface SessionTask {
  type: 'exercise' | 'vocabulary';
  skill?: 'reading' | 'listening';
  exerciseType?: string;   // khớp với questionGroup.type
  questionCount?: number;
  minAccuracy?: number;
  topicSlug?: string;
  wordCount?: number;
}

export interface LearningSession {
  id: number;
  phase: number;
  title: string;
  subtitle: string;
  skill: 'Reading' | 'Listening' | 'Both' | 'Vocabulary';
  hasTheory: boolean;
  estimatedMinutes: number;
  tasks: SessionTask[];
  minAccuracy: number;
  isPhaseTest: boolean;
  theoryHtml?: string;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private cache$?: Observable<LearningSession[]>;

  constructor(private http: HttpClient) {}

  getSessions(): Observable<LearningSession[]> {
    this.cache$ ??= this.http
      .get<LearningSession[]>('assets/data/sessions.json')
      .pipe(shareReplay(1));
    return this.cache$;
  }

  /** Chuyển exerciseType thành URL slug khớp với /exercises/:skill/:type */
  typeToSlug(exerciseType: string): string {
    return exerciseType.toLowerCase().replace(/[\s/]+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
}
