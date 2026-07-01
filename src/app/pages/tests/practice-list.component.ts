import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Test } from '../../models/app.models';
import { EXERCISE_TYPES_BY_SKILL } from '../../models/exercise-types';
import { TestDataService } from '../../core/services/test-data.service';

@Component({
  selector: 'app-practice-list',
  templateUrl: './practice-list.component.html',
  styleUrls: ['./practice-list.component.scss']
})
export class PracticeListComponent implements OnInit {
  tests: Test[] = [];
  filteredTests: Test[] = [];
  selectedSkill = '';
  loading = true;
  seeding = false;
  showSeedBtn = true;

  readonly guideSteps = [
    { num: '1', title: 'Đọc kỹ đề bài', desc: 'Xem nhanh cấu trúc đề và câu hỏi trước khi đọc passage hoặc nghe audio.' },
    { num: '2', title: 'Làm đúng thời gian', desc: 'Reading 60 phút, Listening 30 phút. Câu khó hãy đánh dấu và quay lại sau.' },
    { num: '3', title: 'Review câu sai', desc: 'Sau khi nộp bài, xem lại đáp án và lý do sai để cải thiện lần tiếp theo.' },
    { num: '4', title: 'Ghi chú từ mới', desc: 'Lưu lại từ vựng, collocation và bẫy đề thường gặp trong mỗi bài.' }
  ];

  constructor(
    private testDataService: TestDataService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadTests();
    this.route.queryParamMap.subscribe(params => {
      this.applyFilter(params.get('skill') ?? '');
    });
  }

  applyFilter(skill: string): void {
    this.selectedSkill = skill;
    this.filteredTests = skill ? this.tests.filter(t => t.skill === skill) : [...this.tests];
  }

  getDisplayTitle(test: Test, index: number): string {
    const quickNumber = index + 1;
    const normalized = test.title.replace(/^IELTS Academic\s+/i, '').replace(/\s+-\s+/g, ' - ');

    if (/practice test|sample test/i.test(normalized)) {
      return `${test.skill} Quick Test #${quickNumber}`;
    }

    return normalized || `${test.skill} Quick Test #${quickNumber}`;
  }

  getPrimaryCount(test: Test): string {
    const total = this.getQuestionCount(test);
    if (test.skill === 'Listening') {
      return `🎧 ${total} câu nghe - Điền khuyết`;
    }

    return `📄 ${test.partsCount ?? test.parts.length} passages`;
  }

  getSecondaryCount(test: Test): string {
    const total = this.getQuestionCount(test);
    if (test.skill === 'Listening') {
      return `📚 ${test.partsCount ?? test.parts.length} sections - Chi tiết`;
    }

    return `📚 ${total} câu đọc - Chi tiết`;
  }

  getAttemptCount(test: Test, index: number): number {
    if (test.attempts !== undefined) {
      return test.attempts;
    }

    const base = [20328, 14186, 6331, 4580, 3400, 2604, 2436, 2329, 2257, 1877, 1842, 1816];
    return base[index % base.length];
  }

  getQuestionTypes(test: Test): string[] {
    if (test.questionTypes) {
      return test.questionTypes;
    }
    const order = EXERCISE_TYPES_BY_SKILL[test.skill] ?? [];
    const types = [...new Set(
      test.parts.flatMap(p => (p.questionGroups ?? []).map(g => g.type))
    )];
    return types.sort((a, b) => {
      const ai = order.indexOf(a as never);
      const bi = order.indexOf(b as never);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }

  getQuestionCount(test: Test): number {
    if (test.questionCount !== undefined) {
      return test.questionCount;
    }
    return test.parts.reduce(
      (sum, p) => sum + p.questionGroups.reduce((s, g) => s + g.questions.length, 0), 0
    );
  }

  getDifficulty(test: Test): number {
    const count = this.getQuestionCount(test);
    if (count <= 13) return 2;
    if (count <= 27) return 3;
    if (count <= 36) return 4;
    return 5;
  }

  getDifficultyLabel(test: Test): string {
    const d = this.getDifficulty(test);
    return ['', 'Dễ', 'Cơ bản', 'Trung bình', 'Khó', 'Rất khó'][d] ?? 'Trung bình';
  }

  async seedDemoTests(): Promise<void> {
    if (this.seeding) {
      return;
    }
    this.seeding = true;
    try {
      await this.testDataService.seedDemoTestsToFirebase();
      this.loadTests();
    } catch (err) {
      console.error('Seed failed in component:', err);
    } finally {
      this.seeding = false;
    }
  }

  private loadTests(): void {
    this.loading = true;
    this.testDataService.getTests().subscribe(tests => {
      this.tests = tests.filter(t => t.partsCount === undefined || t.partsCount > 0 || t.parts.some(p => (p.questionGroups ?? []).length > 0));
      this.applyFilter(this.route.snapshot.queryParamMap.get('skill') ?? '');
      this.loading = false;
    });
  }
}
