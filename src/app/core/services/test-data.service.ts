import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom, forkJoin, from, map, of, switchMap } from 'rxjs';
import { Submission, Test } from '../../models/app.models';
import { UserProfileService } from './user-profile.service';
import { CloudTestService } from './cloud-test.service';

const SUBMISSIONS_KEY = 'ielts9s-submissions';

@Injectable({ providedIn: 'root' })
export class TestDataService {
  constructor(
    private http: HttpClient,
    private userProfileService: UserProfileService,
    private cloudTestService: CloudTestService
  ) {}

  getTests(filters?: { skill?: string; source?: string }): Observable<Test[]> {
    const assetTests$ = forkJoin([
      this.http.get<Test[]>('assets/data/reading-tests.json'),
      this.http.get<Test[]>('assets/data/listening-tests.json')
    ]).pipe(
      map(([readingTests, listeningTests]) => [...readingTests, ...listeningTests])
    );

    const source$ = this.cloudTestService.isEnabled()
      ? from(this.cloudTestService.getTests(filters?.skill as Test['skill'] | undefined)).pipe(
          switchMap((cloudTests) => {
            const hasContent = cloudTests.some(t => (t.parts?.length ?? 0) > 0);
            return hasContent ? of(cloudTests) : assetTests$;
          })
        )
      : assetTests$;

    return source$.pipe(
      map((tests) => tests.filter((test) => {
        const bySkill = filters?.skill ? test.skill === filters.skill : true;
        const bySource = filters?.source ? test.source === filters.source : true;
        return bySkill && bySource;
      }))
    );
  }

  getTestById(testId: string): Observable<Test | null> {
    if (this.cloudTestService.isEnabled()) {
      return from(this.cloudTestService.getTestById(testId)).pipe(
        switchMap((cloudTest) => cloudTest ? of(cloudTest) : this.getTests().pipe(
          map((tests) => tests.find((test) => test.id === testId) ?? null)
        ))
      );
    }

    return this.getTests().pipe(map((tests) => tests.find((test) => test.id === testId) ?? null));
  }

  async getTestSnapshot(testId: string): Promise<Test | null> {
    return firstValueFrom(this.getTestById(testId));
  }

  async submitTest(userId: string, test: Test, answers: Record<string, string>): Promise<Submission> {
    const score = this.calculateScore(test, answers);
    const bandScore = this.getBandScore(score);
    const submission: Submission = {
      id: `${Date.now()}`,
      userId,
      testId: test.id,
      testTitle: test.title,
      skill: test.skill,
      answers,
      score,
      bandScore,
      createdAt: new Date().toISOString()
    };

    const submissions = this.readSubmissions();
    submissions.unshift(submission);
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));

    await this.userProfileService.updateUserStats(userId, test, answers, bandScore);
    return submission;
  }

  async getRecentUserSubmissions(userId: string, limit = 4): Promise<Submission[]> {
    return this.readSubmissions()
      .filter((submission) => submission.userId === userId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  async seedDemoTestsToFirebase(): Promise<void> {
    await this.cloudTestService.seedDemoTests();
  }

  private calculateScore(test: Test, answers: Record<string, string>): number {
    return Object.keys(test.answerKey).reduce((total, questionId) => {
      const expected = (test.answerKey[questionId] ?? '').trim().toLowerCase();
      const actual = (answers[questionId] ?? '').trim().toLowerCase();
      return total + (expected === actual ? 1 : 0);
    }, 0);
  }

  private getBandScore(score: number): number {
    if (score >= 39) { return 9; }
    if (score >= 37) { return 8.5; }
    if (score >= 35) { return 8; }
    if (score >= 33) { return 7.5; }
    if (score >= 30) { return 7; }
    if (score >= 27) { return 6.5; }
    if (score >= 23) { return 6; }
    if (score >= 19) { return 5.5; }
    if (score >= 15) { return 5; }
    if (score >= 13) { return 4.5; }
    return 4;
  }

  private readSubmissions(): Submission[] {
    const raw = localStorage.getItem(SUBMISSIONS_KEY);
    return raw ? JSON.parse(raw) as Submission[] : [];
  }
}
