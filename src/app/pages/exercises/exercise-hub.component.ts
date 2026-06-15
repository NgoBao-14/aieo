import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ExerciseCatalogItem, ExerciseCatalogService } from '../../core/services/exercise-catalog.service';

interface ComingSoonType { type: string; desc: string; }

@Component({
  selector: 'app-exercise-hub',
  templateUrl: './exercise-hub.component.html',
  styleUrls: ['./exercise-hub.component.scss']
})
export class ExerciseHubComponent implements OnInit {
  catalog: ExerciseCatalogItem[] = [];
  loading = true;
  selectedSkill: '' | 'Reading' | 'Listening' = '';

  readonly readingComingSoon: ComingSoonType[] = [
    { type: 'Matching Headings',   desc: 'Ghép tiêu đề phù hợp với từng đoạn trong bài đọc.' },
    { type: 'Yes / No / Not Given', desc: 'Xác định quan điểm của tác giả: đồng ý, phủ nhận hay không đề cập.' },
    { type: 'Matching Information', desc: 'Tìm đoạn văn chứa thông tin tương ứng với từng mô tả.' },
    { type: 'Sentence Completion',  desc: 'Hoàn thành câu bằng từ/cụm từ lấy từ bài đọc.' },
    { type: 'Summary Completion',   desc: 'Điền từ vào đoạn tóm tắt — kiểm tra hiểu tổng thể.' },
    { type: 'Diagram Labelling',    desc: 'Dán nhãn các phần của sơ đồ dựa trên thông tin trong bài.' },
  ];

  readonly listeningComingSoon: ComingSoonType[] = [
    { type: 'Matching',              desc: 'Ghép thông tin nghe được với các lựa chọn cho trước.' },
    { type: 'Sentence Completion',   desc: 'Điền từ vào chỗ trống để hoàn thành câu khi nghe.' },
    { type: 'Map / Plan Labelling',  desc: 'Nghe và điền nhãn lên bản đồ hoặc sơ đồ mặt bằng.' },
    { type: 'Flow-chart Completion', desc: 'Hoàn thành lưu đồ quy trình từ nội dung nghe.' },
    { type: 'Table Completion',      desc: 'Điền thông tin vào bảng dựa trên bài nghe.' },
    { type: 'Short Answer',          desc: 'Trả lời câu hỏi ngắn bằng từ lấy từ bài nghe.' },
  ];

  private readonly typeDescriptions: Record<string, string> = {
    'True - False - Not Given': 'Xác định mệnh đề là đúng, sai hay không có trong bài đọc.',
    'Note Completion':          'Điền từ vào ghi chú tóm tắt thông tin từ bài đọc.',
    'Multiple Choice':          'Chọn đáp án đúng — kiểm tra hiểu chi tiết và suy luận.',
    'Form Completion':          'Điền thông tin vào biểu mẫu dựa trên nội dung bài nghe.',
  };

  constructor(
    private router: Router,
    private exerciseCatalogService: ExerciseCatalogService
  ) {}

  ngOnInit(): void { this.loadCatalog(); }

  get readingCatalog():   ExerciseCatalogItem[] { return this.catalog.filter(i => i.skill === 'Reading'); }
  get listeningCatalog(): ExerciseCatalogItem[] { return this.catalog.filter(i => i.skill === 'Listening'); }
  get totalQuestions(): number { return this.catalog.reduce((s, i) => s + i.questionCount, 0); }
  get totalTypes():     number { return this.catalog.length; }
  get totalSources():   number { return this.catalog.reduce((max, i) => Math.max(max, i.testCount), 0); }

  setSkill(skill: '' | 'Reading' | 'Listening'): void {
    this.selectedSkill = skill;
    this.loadCatalog();
  }

  getTypeDescription(type: string): string {
    return this.typeDescriptions[type] ?? 'Luyện tập dạng câu hỏi này để nâng cao kỹ năng IELTS.';
  }

  goToExercise(item: ExerciseCatalogItem): void {
    const skill = item.skill.toLowerCase();
    const type  = item.type.toLowerCase().replace(/[\s/]+/g, '-').replace(/[^a-z0-9-]/g, '');
    this.router.navigate(['/exercises', skill, type]);
  }

  private loadCatalog(): void {
    this.loading = true;
    this.exerciseCatalogService.getCatalog(this.selectedSkill || undefined).subscribe(catalog => {
      this.catalog = catalog;
      this.loading = false;
    });
  }
}
