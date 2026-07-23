import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Test } from '../../models/app.models';
import { EXERCISE_TYPES_BY_SKILL } from '../../models/exercise-types';
import { TestDataService } from '../../core/services/test-data.service';

export type PracticeCategory = 
  | 'toeic' 
  | 'predict' 
  | 'stats' 
  | 'writing_skills' 
  | 'writing_history' 
  | 'speaking_skills' 
  | 'speaking_history';

export interface ToeicPartOption {
  id: string;
  name: string;
  selected: boolean;
}

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

  activeCategory: PracticeCategory = 'toeic';

  // MODAL TOIEC CONFIG STATE
  showConfigModal = false;
  selectedTest: Test | null = null;
  selectedTestTitle = '';
  selectedTime = 60;
  timeOptions = [15, 30, 45, 60, 75, 90, 120];

  practiceMode: 'full' | 'single' = 'full';
  selectedPassage: 'passage1' | 'passage2' | 'passage3' = 'passage1';
  selectedInterface: 'practice' | 'real' = 'practice';

  listeningParts: ToeicPartOption[] = [
    { id: 'part1', name: 'Part 1: Mô tả tranh', selected: true },
    { id: 'part2', name: 'Part 2: Hỏi-Đáp', selected: true },
    { id: 'part3', name: 'Part 3: Hội thoại', selected: true },
    { id: 'part4', name: 'Part 4: Bài nói', selected: true }
  ];

  readingParts: ToeicPartOption[] = [
    { id: 'part5', name: 'Part 5: Hoàn thành câu', selected: true },
    { id: 'part6', name: 'Part 6: Hoàn thành đoạn văn', selected: true },
    { id: 'part7', name: 'Part 7: Đọc hiểu', selected: true }
  ];

  readonly predictTests = [
    { id: 1, num: '#1', title: 'Tuần 3 - Tháng 4', attempts: '2,271' },
    { id: 2, num: '#2', title: 'Tuần 4 - Tháng 4', attempts: '2,170' },
    { id: 3, num: '#3', title: 'Tuần 1 - Tháng 5', attempts: '2,372' },
    { id: 4, num: '#4', title: 'Tuần 2 - Tháng 5', attempts: '2,473' }
  ];

  readonly foundationWriting = [
    {
      id: 'trans',
      icon: '🌐',
      bgColor: '#e6f4ea',
      iconColor: '#137333',
      title: 'Dịch Việt – Anh',
      desc: 'Rèn cách chuyển ý chính xác và diễn đạt tự nhiên bằng tiếng Anh.'
    },
    {
      id: 'two-words',
      icon: 'T T',
      bgColor: '#e0f2fe',
      iconColor: '#0369a1',
      title: 'Viết câu với hai từ',
      desc: 'Luyện dạng từ, ngữ pháp và collocation qua từng câu ngắn.'
    }
  ];

  readonly taskWriting = [
    {
      id: 'part1',
      part: 'Part 1',
      icon: '🖼️',
      bgColor: '#f3e8ff',
      title: 'Mô tả tranh',
      desc: 'Viết một câu mô tả tranh, bắt buộc dùng đủ hai từ cho sẵn.'
    },
    {
      id: 'part2',
      part: 'Part 2',
      icon: '✉️',
      bgColor: '#e0f2fe',
      title: 'Viết email',
      desc: 'Phản hồi email đúng mục đích, đủ yêu cầu và phù hợp văn phong công việc.'
    },
    {
      id: 'part3',
      part: 'Part 3',
      icon: '📝',
      bgColor: '#ffedd5',
      title: 'Viết bài luận',
      desc: 'Trình bày quan điểm với lý do, ví dụ và bố cục mạch lạc.'
    }
  ];

  readonly speakingTasksRow1 = [
    {
      part: 'PART 1',
      icon: '📖',
      accentColor: '#ea580c',
      bgColor: '#fff7ed',
      btnBg: '#ffedd5',
      title: 'Đọc thành tiếng',
      desc: 'Đọc rõ đoạn văn, giữ nhịp và ngữ điệu tự nhiên.',
      questions: 'Câu 1–2',
      time: '45 giây'
    },
    {
      part: 'PART 2',
      icon: '🖼️',
      accentColor: '#10b981',
      bgColor: '#ecfdf5',
      btnBg: '#d1fae5',
      title: 'Mô tả tranh',
      desc: 'Tổ chức mô tả theo vị trí, chủ thể và hành động chính.',
      questions: 'Câu 3–4',
      time: '30 giây'
    },
    {
      part: 'PART 3',
      icon: '❓',
      accentColor: '#2563eb',
      bgColor: '#eff6ff',
      btnBg: '#dbeafe',
      title: 'Trả lời câu hỏi',
      desc: 'Phản hồi trực tiếp, đúng trọng tâm và đủ chi tiết.',
      questions: 'Câu 5–7',
      time: '15–30 giây'
    }
  ];

  readonly speakingTasksRow2 = [
    {
      part: 'PART 4',
      icon: '📄',
      accentColor: '#ea580c',
      bgColor: '#fff7ed',
      btnBg: '#ffedd5',
      title: 'Dùng thông tin',
      desc: 'Đọc bảng và trả lời chính xác tên, giờ, giá hoặc địa điểm.',
      questions: 'Câu 8–10',
      time: '15–30 giây'
    },
    {
      part: 'PART 5',
      icon: '💡',
      accentColor: '#7c3aed',
      bgColor: '#f5f3ff',
      btnBg: '#ede9fe',
      title: 'Trình bày quan điểm',
      desc: 'Nêu lập trường, phát triển hai lý do và ví dụ rõ ràng.',
      questions: 'Câu 11',
      time: '60 giây'
    }
  ];

  readonly guideSteps = [
    { num: '1', title: 'Đọc kỹ đề bài', desc: 'Xem nhanh cấu trúc đề và câu hỏi trước khi đọc passage hoặc nghe audio.' },
    { num: '2', title: 'Làm đúng thời gian', desc: 'Reading 60 phút, Listening 30 phút. Câu khó hãy đánh dấu và quay lại sau.' },
    { num: '3', title: 'Review câu sai', desc: 'Sau khi nộp bài, xem lại đáp án và lý do sai để cải thiện lần tiếp theo.' },
    { num: '4', title: 'Ghi chú từ mới', desc: 'Lưu lại từ vựng, collocation và bẫy đề thường gặp trong mỗi bài.' }
  ];

  constructor(
    private testDataService: TestDataService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTests();
    this.route.queryParamMap.subscribe(params => {
      this.applyFilter(params.get('skill') ?? '');
    });
  }

  openTestModal(test: Test, index: number): void {
    this.selectedTest = test;
    const skillName = test.skill || 'Reading';
    this.selectedTestTitle = `${skillName} - Test ${index + 1}`;
    this.practiceMode = 'full';
    this.selectedPassage = 'passage1';
    this.selectedInterface = 'practice';
    this.showConfigModal = true;
  }

  closeTestModal(): void {
    this.showConfigModal = false;
    this.selectedTest = null;
  }

  isAllSelected(): boolean {
    return this.listeningParts.every(p => p.selected) && this.readingParts.every(p => p.selected);
  }

  toggleSelectAll(): void {
    const targetState = !this.isAllSelected();
    this.listeningParts.forEach(p => p.selected = targetState);
    this.readingParts.forEach(p => p.selected = targetState);
  }

  startSelectedTest(): void {
    if (this.selectedTest) {
      const testId = this.selectedTest.id;
      this.closeTestModal();
      this.router.navigate(['/tests', testId]);
    }
  }

  selectCategory(cat: PracticeCategory): void {
    this.activeCategory = cat;
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
