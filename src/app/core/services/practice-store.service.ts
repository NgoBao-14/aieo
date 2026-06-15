import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface PracticeState {
  testId: string | null;
  answers: Record<string, string>;
}

const STORE_KEY = 'ielts9s-practice';

@Injectable({ providedIn: 'root' })
export class PracticeStoreService {
  private readonly stateSubject = new BehaviorSubject<PracticeState>(this.readInitialState());
  readonly state$ = this.stateSubject.asObservable();

  get snapshot(): PracticeState {
    return this.stateSubject.value;
  }

  startTest(testId: string): void {
    this.patchState({
      testId,
      answers: {}
    });
  }

  setAnswer(questionId: string, value: string): void {
    this.patchState({
      answers: {
        ...this.snapshot.answers,
        [questionId]: value
      }
    });
  }

  clearTest(): void {
    this.patchState({
      testId: null,
      answers: {}
    });
  }

  private patchState(partial: Partial<PracticeState>): void {
    const nextState = {
      ...this.snapshot,
      ...partial
    };
    this.stateSubject.next(nextState);
    localStorage.setItem(STORE_KEY, JSON.stringify(nextState));
  }

  private readInitialState(): PracticeState {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) as PracticeState : { testId: null, answers: {} };
  }
}
