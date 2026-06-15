import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TestDataService } from '../../../core/services/test-data.service';
import { Test } from '../../../models/app.models';

@Component({
  selector: 'app-test-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <h1>{{ isNewTest ? 'Create New Test' : 'Edit Test' }}</h1>
      </div>

      <div class="form-container">
        <form [formGroup]="testForm" (ngSubmit)="onSubmit()">
          <!-- Step 1: Test Info -->
          <section class="form-section">
            <h2>Test Information</h2>

            <div class="form-group">
              <label for="testId">Test ID</label>
              <input
                id="testId"
                type="text"
                formControlName="id"
                placeholder="ielts-reading-01"
                [readonly]="!isNewTest"
              >
              <small>Unique identifier, e.g., ielts-reading-full-01</small>
            </div>

            <div class="form-group">
              <label for="title">Test Title *</label>
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
                <label for="skill">Skill *</label>
                <select id="skill" formControlName="skill" required>
                  <option value="">Select...</option>
                  <option value="Reading">Reading</option>
                  <option value="Listening">Listening</option>
                </select>
              </div>

              <div class="form-group">
                <label for="source">Source</label>
                <input
                  id="source"
                  type="text"
                  formControlName="source"
                  placeholder="IELTS9s Original"
                >
              </div>
            </div>
          </section>

          <!-- Step 2: Parts (Coming Soon) -->
          <section class="form-section">
            <h2>Parts/Sections</h2>
            <div class="coming-soon">
              <p>Part editor coming soon. For now, create tests using Excel → JSON conversion.</p>
              <p>See: <a href="/docs/EXCEL_TO_JSON_GUIDE.md" target="_blank">Excel to JSON Guide</a></p>
            </div>
          </section>

          <!-- Step 3: Upload JSON -->
          <section class="form-section">
            <h2>Or Import from JSON</h2>
            <div class="form-group">
              <label for="jsonFile">Upload JSON File</label>
              <input
                id="jsonFile"
                type="file"
                accept=".json"
                (change)="onJsonFileSelected($event)"
              >
              <small>Upload a JSON file exported from Excel conversion</small>
            </div>
            <div *ngIf="jsonPreview" class="preview">
              <pre>{{ jsonPreview | json }}</pre>
            </div>
          </section>

          <!-- Actions -->
          <div class="form-actions">
            <button type="submit" class="btn btn--primary" [disabled]="testForm.invalid">
              {{ isNewTest ? 'Create Test' : 'Update Test' }}
            </button>
            <button type="button" class="btn btn--ghost" (click)="goBack()">Cancel</button>
          </div>
        </form>
      </div>

      <!-- Info Box -->
      <div class="info-box">
        <h3>💡 Recommended Workflow</h3>
        <ol>
          <li>Fill Excel template with test data</li>
          <li>Run: <code>node scripts/excel-to-json.js your-file.xlsx</code></li>
          <li>JSON auto-generated → <code>src/assets/data/</code></li>
          <li>App loads tests automatically ✨</li>
        </ol>
        <p><a href="/docs/EXCEL_STRUCTURE.md" target="_blank">See Excel Structure Guide →</a></p>
      </div>
    </div>
  `,
  styleUrls: ['./test-form.component.scss']
})
export class TestFormComponent implements OnInit {
  testForm!: FormGroup;
  isNewTest = true;
  currentTestId: string | null = null;
  jsonPreview: any = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private testDataService: TestDataService
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
      }
    });
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
          this.testForm.patchValue({
            id: test.id,
            title: test.title,
            skill: test.skill,
            source: test.source
          });
        } catch (error) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  }

  onSubmit() {
    if (this.testForm.valid) {
      alert('Test creation coming soon! For now, use Excel → JSON conversion workflow.');
      // TODO: Implement actual test creation/update
    }
  }

  goBack() {
    this.router.navigate(['/admin/tests']);
  }
}
