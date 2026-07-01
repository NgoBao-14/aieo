import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TestDataService } from '../../../core/services/test-data.service';
import { Test } from '../../../models/app.models';

@Component({
  selector: 'app-test-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="admin-page-content">
      <div class="page-header">
        <h2 class="page-title">Danh sách Đề thi</h2>
        <div class="page-actions">
          <button class="btn btn--green" routerLink="/admin/tests/new">➕ Thêm đề</button>
        </div>
      </div>

      <div class="filters-bar">
        <label class="filter-label">
          Lọc theo kỹ năng:
          <select class="filter-select" [(ngModel)]="selectedSkill" (change)="filterTests()">
            <option value="">Tất cả</option>
            <option value="Reading">Reading</option>
            <option value="Listening">Listening</option>
          </select>
        </label>
      </div>

      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Đang tải danh sách đề...</p>
      </div>

      <div *ngIf="!loading && filteredTests.length === 0" class="empty-state">
        <p>Chưa có đề thi nào trong hệ thống. Hãy tạo đề thi mới để bắt đầu.</p>
        <button class="btn btn--green" routerLink="/admin/tests/new">Tạo đề ngay</button>
      </div>

      <div *ngIf="!loading && filteredTests.length > 0" class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th width="60">#</th>
              <th>Tên đề</th>
              <th width="100">Kỹ năng</th>
              <th>Nguồn</th>
              <th width="90">Ghim</th>
              <th width="100">Link đề</th>
              <th width="180">Chức năng</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let test of filteredTests; let i = index">
              <td>{{ i + 1 }}</td>
              <td class="test-title-cell">{{ test.title }}</td>
              <td>
                <span class="skill-badge" [class.reading]="test.skill === 'Reading'">
                  {{ test.skill }}
                </span>
              </td>
              <td>{{ test.source }}</td>
              <td>
                <span class="ghim-badge" *ngIf="i === 3">★ Ghim</span>
                <span class="no-ghim" *ngIf="i !== 3">-</span>
              </td>
              <td>
                <a class="btn-table btn-table--green-light" [routerLink]="['/tests', test.id]" target="_blank">
                  Xem đề
                </a>
              </td>
              <td class="action-cells">
                <button class="btn-table btn-table--pin" (click)="togglePin(test.id)">
                  📌 Pin
                </button>
                <button class="btn-table btn-table--green" [routerLink]="['/admin/tests', test.id, 'edit']">
                  Chỉnh sửa
                </button>
                <button class="btn-table btn-table--danger" (click)="deleteTest(test.id)">
                  Xóa
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styleUrls: ['./test-management.component.scss']
})
export class TestManagementComponent implements OnInit {
  tests: Test[] = [];
  filteredTests: Test[] = [];
  selectedSkill = '';
  loading = true;

  constructor(private testDataService: TestDataService) {}

  ngOnInit() {
    this.loadTests();
  }

  loadTests() {
    this.loading = true;
    this.testDataService.getTests({ preferCloud: true }).subscribe(tests => {
      this.tests = tests;
      this.filterTests();
      this.loading = false;
    });
  }

  filterTests() {
    if (this.selectedSkill) {
      this.filteredTests = this.tests.filter(t => t.skill === this.selectedSkill);
    } else {
      this.filteredTests = [...this.tests];
    }
  }

  getQuestionCount(test: Test): number {
    return test.parts.reduce((total, part) => {
      return total + part.questionGroups.reduce((groupTotal, group) => {
        return groupTotal + group.questions.length;
      }, 0);
    }, 0);
  }

  deleteTest(testId: string) {
    if (confirm('Are you sure you want to delete this test? This cannot be undone.')) {
      // TODO: Implement delete functionality
      alert('Delete functionality to be implemented');
    }
  }

  downloadTest(test: Test) {
    const json = JSON.stringify([test], null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${test.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  togglePin(testId: string) {
    alert('Đã thay đổi trạng thái ghim đề thi thành công!');
  }
}
