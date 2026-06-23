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
    { num: '1', title: 'Đọc kỹ đề bài',          desc: 'Đọc instructions và xem qua toàn bộ câu hỏi trước khi đọc passage hoặc nghe audio.' },
    { num: '2', title: 'Làm trong thời gian giới hạn', desc: 'Reading: 60 phút / Listening: 30 phút. Không dừng lại khi không biết — làm tiếp, quay lại sau.' },
    { num: '3', title: 'Review đáp án sai',         desc: 'Sau khi nộp, xem lại câu sai và hiểu tại sao sai. Đây là bước quan trọng nhất để cải thiện.' },
    { num: '4', title: 'Ghi chú từ vựng mới',       desc: 'Mỗi đề có 20–30 từ học thuật mới. Lưu vào khu Từ Vựng để ôn lại.' },
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
    console.log('seedDemoTests button clicked!');
    if (this.seeding) {
      console.log('Already seeding, ignoring.');
      return;
    }
    this.seeding = true;
    try {
      console.log('Calling testDataService.seedDemoTestsToFirebase...');
      await this.testDataService.seedDemoTestsToFirebase();
      console.log('Seed completed successfully! Reloading tests...');
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
