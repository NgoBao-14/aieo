import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TestDataService } from '../../../core/services/test-data.service';
import { ExcelParserService } from '../../../core/services/excel-parser.service';
import { CloudTestService } from '../../../core/services/cloud-test.service';
import { Test } from '../../../models/app.models';

@Component({
  selector: 'app-test-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <h1>{{ isNewTest ? 'Tạo đề thi mới' : 'Chỉnh sửa đề thi' }}</h1>
      </div>

      <div class="form-container">
        <form [formGroup]="testForm" (ngSubmit)="onSubmit()">
          <!-- Step 1: Test Info -->
          <section class="form-section">
            <h2>Thông tin đề thi</h2>

            <div class="form-group">
              <label for="testId">Mã đề thi (Test ID) *</label>
              <input
                id="testId"
                type="text"
                formControlName="id"
                placeholder="ielts-reading-01"
                [readonly]="!isNewTest"
                required
              >
              <small>Định danh duy nhất, ví dụ: ielts-reading-full-01</small>
            </div>

            <div class="form-group">
              <label for="title">Tiêu đề đề thi *</label>
              <input
                id="title"
                type="text"
                formControlName="title"
                placeholder="IELTS Academic Reading - Practice Test 1"
                required
              >
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="skill">Kỹ năng *</label>
                <select id="skill" formControlName="skill" required>
                  <option value="">Chọn...</option>
                  <option value="Reading">Reading</option>
                  <option value="Listening">Listening</option>
                </select>
              </div>

              <div class="form-group">
                <label for="source">Nguồn đề</label>
                <input
                  id="source"
                  type="text"
                  formControlName="source"
                  placeholder="IELTS9s Original"
                >
              </div>
            </div>
          </section>

          <!-- Step 2: Upload Excel / JSON -->
          <section class="form-section">
            <h2>Nhập nội dung đề thi</h2>
            <div class="import-options">
              <div class="import-box">
                <h3>Cách A: Nhập từ Excel (.xlsx)</h3>
                <input
                  id="excelFile"
                  type="file"
                  accept=".xlsx, .xls"
                  (change)="onExcelFileSelected($event)"
                >
                <small>Quy trình khuyên dùng. Tự động phân tích cấu trúc các sheets.</small>
              </div>
              
              <div class="import-box">
                <h3>Cách B: Nhập từ JSON (.json)</h3>
                <input
                  id="jsonFile"
                  type="file"
                  accept=".json"
                  (change)="onJsonFileSelected($event)"
                >
                <small>Tải lên tệp JSON đã cấu trúc sẵn.</small>
              </div>
            </div>

            <div *ngIf="parsedTest" class="parsed-summary">
              <h3>📊 Tóm tắt nội dung</h3>
              <div class="summary-grid">
                <div><strong>Mã đề:</strong> {{ parsedTest.id }}</div>
                <div><strong>Kỹ năng:</strong> {{ parsedTest.skill }}</div>
                <div><strong>Số phần (Parts):</strong> {{ parsedTest.partsCount }} phần</div>
                <div><strong>Số câu hỏi:</strong> {{ parsedTest.questionCount }} câu</div>
                <div class="span-all"><strong>Dạng câu hỏi:</strong> {{ parsedTest.questionTypes?.join(', ') }}</div>
              </div>

              <!-- Passages Content configuration (Reading only) -->
              <div *ngIf="parsedTest.skill === 'Reading'" class="parts-passage-inputs">
                <h4>📖 Nội dung bài đọc (HTML)</h4>
                <div *ngFor="let part of parsedTest.parts; let i = index" class="part-passage-input">
                  <label>Part {{ part.number }}: {{ part.title }}</label>
                  <textarea 
                    rows="6" 
                    [(ngModel)]="partPassages[i]" 
                    [ngModelOptions]="{standalone: true}"
                    placeholder="Nhập hoặc dán nội dung bài đọc HTML tại đây (ví dụ: <div class='passage-section'>...</div>)"
                  ></textarea>
                </div>
              </div>

              <!-- Audio Files upload (Listening only) -->
              <div *ngIf="parsedTest.skill === 'Listening'" class="parts-audio-inputs">
                <h4>🎧 File âm thanh cho các phần</h4>
                <div *ngFor="let part of parsedTest.parts; let i = index" class="part-audio-input">
                  <label>Part {{ part.number }}: {{ part.title }}</label>
                  <div class="audio-upload-row">
                    <input 
                      type="file" 
                      accept="audio/*" 
                      (change)="onPartAudioSelected($event, i)"
                    >
                    <span *ngIf="part.audioUrl" class="audio-status audio-status--done">✓ Đã tải</span>
                    <span *ngIf="uploadingPartIndex === i" class="audio-status audio-status--loading">Đang tải...</span>
                  </div>
                  <small *ngIf="part.audioUrl" class="audio-url">URL: {{ part.audioUrl }}</small>
                </div>
              </div>
            </div>
          </section>

          <!-- Actions -->
          <div class="form-actions">
            <button type="submit" class="btn btn--primary" [disabled]="testForm.invalid || !parsedTest">
              {{ isNewTest ? 'Tạo đề thi' : 'Cập nhật' }}
            </button>
            <button type="button" class="btn btn--ghost" (click)="goBack()">Hủy</button>
          </div>
        </form>
      </div>

      <!-- Info Box -->
      <div class="info-box">
        <h3>💡 Quy trình khuyên dùng</h3>
        <ol>
          <li>Điền dữ liệu đề thi vào file Excel mẫu</li>
          <li>Tải trực tiếp file <code>.xlsx</code> lên ở mục trên</li>
          <li>Với Reading: Sao chép-dán nội dung HTML bài đọc vào các ô tương ứng ở trên</li>
          <li>Với Listening: Tải lên file âm thanh cho từng phần (Part)</li>
          <li>Nhấn "Tạo đề thi" để đồng bộ lên Cloud!</li>
        </ol>
        <p><a href="/docs/EXCEL_STRUCTURE.md" target="_blank">Xem Hướng dẫn cấu trúc Excel →</a></p>
      </div>
    </div>
  `,
  styleUrls: ['./test-form.component.scss']
})
export class TestFormComponent implements OnInit {
  testForm!: FormGroup;
  isNewTest = true;
  currentTestId: string | null = null;
  parsedTest: Test | null = null;
  partPassages: string[] = [];
  uploadingPartIndex: number | null = null;
  jsonPreview: any = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private testDataService: TestDataService,
    private excelParserService: ExcelParserService,
    private cloudTestService: CloudTestService
  ) {
    this.testForm = this.fb.group({
      id: ['', Validators.required],
      title: ['', Validators.required],
      skill: ['', Validators.required],
      source: ['IELTS9s Original']
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['testId']) {
        this.isNewTest = false;
        this.currentTestId = params['testId'];
        this.loadTest(params['testId']);
      }
    });
  }

  loadTest(testId: string) {
    this.testDataService.getTestSnapshot(testId).then(test => {
      if (test) {
        this.testForm.patchValue({
          id: test.id,
          title: test.title,
          skill: test.skill,
          source: test.source
        });
        this.testForm.get('id')?.disable();
        this.parsedTest = test;
        this.partPassages = test.parts.map(p => p.passageHtml || '');
      }
    });
  }

  onExcelFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const test = this.excelParserService.parseExcel(e.target.result);
          this.parsedTest = test;
          this.partPassages = test.parts.map(() => '');
          this.testForm.patchValue({
            id: test.id,
            title: test.title,
            skill: test.skill,
            source: test.source
          });
        } catch (error: any) {
          alert('Lỗi phân tích file Excel: ' + error.message);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }

  onJsonFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const json = JSON.parse(e.target.result);
          const test = Array.isArray(json) ? json[0] : json;
          this.jsonPreview = test;
          this.parsedTest = test;
          this.partPassages = test.parts.map((p: any) => p.passageHtml || '');
          this.testForm.patchValue({
            id: test.id,
            title: test.title,
            skill: test.skill,
            source: test.source
          });
        } catch (error) {
          alert('File JSON không hợp lệ');
        }
      };
      reader.readAsText(file);
    }
  }

  async onPartAudioSelected(event: any, partIndex: number) {
    const file = event.target.files[0];
    if (file && this.parsedTest) {
      this.uploadingPartIndex = partIndex;
      const testId = this.testForm.get('id')?.value || this.parsedTest.id || 'unnamed-test';
      const partNumber = this.parsedTest.parts[partIndex].number;
      try {
        const downloadUrl = await this.cloudTestService.uploadAudio(file, testId, partNumber);
        this.parsedTest.parts[partIndex].audioUrl = downloadUrl;
        alert(`Đã tải lên âm thanh Part ${partNumber} thành công!`);
      } catch (error: any) {
        alert('Lỗi tải lên file âm thanh: ' + error.message);
      } finally {
        this.uploadingPartIndex = null;
      }
    }
  }

  async onSubmit() {
    if (this.testForm.valid) {
      const formVal = this.testForm.getRawValue();
      const testToSave = this.parsedTest;
      
      if (!testToSave) {
        alert('Vui lòng nhập file Excel hoặc JSON trước.');
        return;
      }

      // Update test metadata with form values
      testToSave.id = formVal.id;
      testToSave.title = formVal.title;
      testToSave.skill = formVal.skill;
      testToSave.source = formVal.source;

      // Update Reading Passages from textareas
      if (testToSave.skill === 'Reading') {
        testToSave.parts.forEach((part, i) => {
          if (this.partPassages[i] !== undefined) {
            part.passageHtml = this.partPassages[i];
          }
        });
      }

      try {
        if (this.isNewTest) {
          await this.cloudTestService.createTest(testToSave);
          alert('Đã tạo đề thi thành công trên Cloud Firestore!');
        } else {
          await this.cloudTestService.updateTest(testToSave.id, testToSave);
          alert('Đã cập nhật đề thi thành công trên Cloud Firestore!');
        }
        this.router.navigate(['/admin/tests']);
      } catch (error: any) {
        alert('Lỗi lưu đề thi lên Cloud: ' + error.message);
      }
    }
  }

  goBack() {
    this.router.navigate(['/admin/tests']);
  }
}
