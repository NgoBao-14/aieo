import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, firstValueFrom, forkJoin, from, map, of, shareReplay, switchMap } from 'rxjs';
import { doc, setDoc } from 'firebase/firestore';
import { Question, QuestionGroup, Submission, Test } from '../../models/app.models';
import { UserProfileService } from './user-profile.service';
import { CloudTestService } from './cloud-test.service';
import { getFirebaseDb } from '../firebase/firebase.client';

import { isAnswerCorrect } from '../utils/answer-checker';

const SUBMISSIONS_KEY = 'ielts9s-submissions';

@Injectable({ providedIn: 'root' })
export class TestDataService {
  private localTests$?: Observable<Test[]>;

  constructor(
    private http: HttpClient,
    private userProfileService: UserProfileService,
    private cloudTestService: CloudTestService
  ) {}

  getTests(filters?: { skill?: string; source?: string; preferCloud?: boolean }): Observable<Test[]> {
    const localTests$ = this.getLocalTests();

    const source$ = filters?.preferCloud && this.cloudTestService.isEnabled()
      ? from(this.cloudTestService.getTests(filters?.skill as Test['skill'] | undefined)).pipe(
          switchMap((cloudTests) => cloudTests.length ? of(cloudTests) : localTests$),
          catchError((err) => {
            console.error('Firebase failed to fetch tests, falling back to local files:', err);
            return localTests$;
          })
        )
      : localTests$;

    return source$.pipe(
      map((tests) => tests.filter((test) => {
        const bySkill = filters?.skill ? test.skill === filters.skill : true;
        const bySource = filters?.source ? test.source === filters.source : true;
        return bySkill && bySource;
      }))
    );
  }

  getTestById(testId: string): Observable<Test | null> {
    return this.getLocalTests().pipe(
      switchMap((tests) => {
        const localTest = tests.find((test) => test.id === testId) ?? null;
        if (localTest || !this.cloudTestService.isEnabled()) {
          return of(localTest);
        }

        return from(this.cloudTestService.getTestById(testId)).pipe(
          catchError((err) => {
            console.error('Firebase failed to fetch test detail:', err);
            return of(null);
          })
        );
      })
    );
  }

  async getTestSnapshot(testId: string): Promise<Test | null> {
    return firstValueFrom(this.getTestById(testId));
  }

  async submitTest(userId: string, test: Test, answers: Record<string, string>): Promise<Submission> {
    console.group('%c [SUBMISSION LOG] 📥 FULL CHI TIẾT NỘP BÀI THI & NƠI LƯU TRỮ', 'color: #2563eb; font-size: 15px; font-weight: bold;');
    console.group('%c 📦 1. THÔNG TIN BÀI THI (TEST OBJECT)', 'color: #0d9488; font-weight: bold;');
    console.log('• ID Bài thi:', test.id);
    console.log('• Tiêu đề:', test.title);
    console.log('• Kỹ năng:', test.skill);
    console.log('• Nguồn đề:', test.source);
    console.log('• Số phần (Parts):', test.partsCount ?? test.parts?.length);
    console.log('• Danh sách câu hỏi & nhóm:', test.parts);
    console.log('• Bảng đáp án gốc (Answer Key):', test.answerKey);
    console.log('• Bảng giải thích chi tiết (Explanations):', test.explanations);
    console.groupEnd();

    const score = this.calculateScore(test, answers);
    const bandScore = this.getBandScore(score);

    // CẤU TRÚC CHI TIẾT CÂU HỎI THEO PART (ĐÚNG THEO ẢNH CHỤP MẪU FIRESTORE CỦA NGƯỜI DÙNG)
    const structuredParts: Record<string, Array<{ id: number; question: string; score: number; userAnswer: string }>> = {};
    (test.parts || []).forEach((part, index) => {
      const partKey = `part${part.number || (index + 1)}`;
      const questionsList: Array<{ id: number; question: string; score: number; userAnswer: string }> = [];
      (part.questionGroups || []).forEach((group) => {
        (group.questions || []).forEach((question) => {
          const userAnswer = answers[String(question.id)] ?? '';
          const expected = (test.answerKey || {})[String(question.id)] ?? '';
          const isCorrect = isAnswerCorrect(userAnswer, expected);

          const questionText = this.extractQuestionText(question, group);

          questionsList.push({
            id: question.id,
            question: questionText,
            score: isCorrect ? 1 : 0,
            userAnswer: userAnswer
          });
        });
      });
      structuredParts[partKey] = questionsList;
    });

    const submission: Submission = {
      id: `${Date.now()}`,
      userId,
      testId: test.id,
      testTitle: test.title,
      skill: test.skill,
      score,
      bandScore,
      createdAt: new Date().toISOString(),
      test,
      ...structuredParts
    };

    console.group('%c 📑 2. CHI TIẾT KẾT QUẢ TỪNG CÂU HỎI (ALL QUESTIONS TABLE)', 'color: #8b5cf6; font-weight: bold;');
    const detailedComparison: any[] = [];
    (test.parts || []).forEach((part, pIdx) => {
      const partName = `Part ${part.number || (pIdx + 1)}: ${part.title || ''}`;
      (part.questionGroups || []).forEach((group) => {
        (group.questions || []).forEach((q) => {
          const qIdStr = String(q.id);
          const actual = answers[qIdStr] ?? '';
          const expected = (test.answerKey || {})[qIdStr] ?? '';
          const explanation = (test.explanations || {})[qIdStr] ?? 'N/A';
          const correct = isAnswerCorrect(actual, expected);

          detailedComparison.push({
            'Câu #': q.id,
            'Phần thi': partName,
            'Dạng câu hỏi': group.type || 'N/A',
            'Đáp án học viên': actual || '(Bỏ qua)',
            'Đáp án chuẩn': expected || '(Chưa có)',
            'Trạng thái': correct ? '✅ ĐÚNG' : (actual ? '❌ SAI' : '⚪ BỎ QUA'),
            'Giải thích': explanation
          });
        });
      });
    });
    console.table(detailedComparison);
    console.groupEnd();

    console.group('%c 💾 3. NƠI LƯU TRỮ DỮ LIỆU BÀI NỘP (STORAGE LOCATIONS)', 'color: #ea580c; font-weight: bold;');
    console.log('📍 [LOCALSTORAGE 1] Lịch sử làm bài: Key = "ielts9s-submissions"');
    console.log('   👉 Xem dữ liệu: JSON.parse(localStorage.getItem("ielts9s-submissions"))');
    console.log('📍 [LOCALSTORAGE 2] Thống kê học viên: Key = "ielts9s_user_profile"');
    console.log('   👉 Xem dữ liệu: JSON.parse(localStorage.getItem("ielts9s_user_profile"))');
    console.log('📍 [FIREBASE FIRESTORE 1] Collection = "history" / Document ID = "' + submission.id + '"');
    console.log('📍 [FIREBASE FIRESTORE 2] Collection = "users" / Document ID = "' + userId + '"');
    console.log('📄 Submssion Payload đầy đủ:', submission);
    console.groupEnd();

    const submissions = this.readSubmissions();
    submissions.unshift(submission);
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));

    if (this.cloudTestService.isEnabled()) {
      const db = getFirebaseDb();
      if (db) {
        this.userProfileService.getUserProfile(userId).then((profile) => {
          const displayName = profile?.displayName || 'Học viên';
          const historyDoc: Record<string, any> = {
            created_at: submission.createdAt,
            month: `${new Date().getMonth() + 1}_${new Date().getFullYear()}`,
            name: displayName,
            userId: submission.userId,
            testId: submission.testId,
            testTitle: submission.testTitle,
            skill: submission.skill,
            score: submission.score,
            bandScore: submission.bandScore,
            ...structuredParts
          };

          test.parts.forEach((part, index) => {
            const partKey = `part${index + 1}`;
            const questionsList: any[] = [];
            part.questionGroups.forEach((group) => {
              group.questions.forEach((question) => {
                const answer = answers[String(question.id)] ?? '';
                const expected = test.answerKey[String(question.id)] ?? '';
                const isCorrect = isAnswerCorrect(answer, expected);
                questionsList.push({
                  id: question.id,
                  score: isCorrect ? 1 : 0,
                  userAnswer: answer
                });
              });
            });
            historyDoc[partKey] = questionsList;
          });

          console.log('🔥 [FIRESTORE PAYLOAD] history/' + submission.id + ':', historyDoc);

          setDoc(doc(db, 'history', submission.id), historyDoc)
            .then(() => console.log('[TestDataService] Saved structured submission to Firestore history:', submission.id))
            .catch((error) => console.error('[TestDataService] Failed to save submission to Firestore:', error));
        }).catch((err) => {
          console.error('[TestDataService] Failed to fetch profile for history:', err);
        });
      }
    }

    console.groupEnd();

    this.userProfileService.updateUserStats(userId, test, answers, bandScore)
      .catch((error) => console.error('[TestDataService] Failed to update user stats:', error));

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
    if (!test || !test.answerKey) {
      return 0;
    }
    return Object.keys(test.answerKey).reduce((total, questionId) => {
      const expected = test.answerKey[questionId];
      const actual = answers[questionId];
      return total + (isAnswerCorrect(actual, expected) ? 1 : 0);
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

  private getLocalTests(): Observable<Test[]> {
    if (!this.localTests$) {
      this.localTests$ = forkJoin([
        this.http.get<Test[]>('assets/data/reading-tests.json'),
        this.http.get<Test[]>('assets/data/listening-tests.json')
      ]).pipe(
        map(([readingTests, listeningTests]) => [...readingTests, ...listeningTests]),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.localTests$;
  }

  private extractQuestionText(question: Question, group: QuestionGroup): string {
    if (question.text && question.text.trim()) {
      return question.text.trim();
    }

    if (group && group.template) {
      const qIdStr = String(question.id);
      const template = group.template;

      const blocks = template.split(/<\/?(?:li|p|div|tr|h\d)[^>]*>/i).filter((b) => b.trim());
      for (const block of blocks) {
        if (
          block.includes(`((${qIdStr}))`) ||
          block.includes(`[[${qIdStr}]]`) ||
          block.includes(`[${qIdStr}]`)
        ) {
          let cleanText = block.replace(/<[^>]*>/g, '').trim();
          cleanText = cleanText
            .replace(new RegExp(`\\(\\(${qIdStr}\\)\\)`, 'g'), '[...]')
            .replace(new RegExp(`\\[\\[${qIdStr}\\]\\]`, 'g'), '[...]')
            .replace(new RegExp(`\\[${qIdStr}\\]`, 'g'), '[...]');
          cleanText = cleanText.replace(/\s+/g, ' ').trim();
          if (cleanText) {
            return cleanText;
          }
        }
      }

      if (
        template.includes(`((${qIdStr}))`) ||
        template.includes(`[[${qIdStr}]]`) ||
        template.includes(`[${qIdStr}]`)
      ) {
        let cleanText = template.replace(/<[^>]*>/g, ' ').trim();
        cleanText = cleanText
          .replace(new RegExp(`\\(\\(${qIdStr}\\)\\)`, 'g'), '[...]')
          .replace(new RegExp(`\\[\\[${qIdStr}\\]\\]`, 'g'), '[...]')
          .replace(new RegExp(`\\[${qIdStr}\\]`, 'g'), '[...]');
        cleanText = cleanText.replace(/\s+/g, ' ').trim();
        if (cleanText) {
          return cleanText;
        }
      }
    }

    if (group && group.instructions) {
      return `[${group.type || 'Question'}] ${group.instructions} (#${question.id})`;
    }

    return `Question #${question.id}`;
  }

  private readSubmissions(): Submission[] {
    const raw = localStorage.getItem(SUBMISSIONS_KEY);
    return raw ? JSON.parse(raw) as Submission[] : [];
  }
}
