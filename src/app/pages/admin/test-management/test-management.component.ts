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
    <div class="admin-page">
      <div class="page-header">
        <h1>Manage Tests</h1>
        <div class="page-actions">
          <button class="btn btn--primary" routerLink="/admin/tests/new">+ New Test</button>
        </div>
      </div>

      <div class="filters-bar">
        <label>
          Filter by Skill:
          <select [(ngModel)]="selectedSkill" (change)="filterTests()">
            <option value="">All</option>
            <option value="Reading">Reading</option>
            <option value="Listening">Listening</option>
          </select>
        </label>
      </div>

      <div *ngIf="loading" class="loading">Loading tests...</div>

      <div *ngIf="!loading && filteredTests.length === 0" class="empty-state">
        <p>No tests found. Create your first test to get started.</p>
        <button class="btn btn--primary" routerLink="/admin/tests/new">Create Test</button>
      </div>

      <div *ngIf="!loading && filteredTests.length > 0" class="tests-table">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Skill</th>
              <th>Source</th>
              <th>Parts</th>
              <th>Questions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let test of filteredTests">
              <td>{{ test.title }}</td>
              <td><span class="badge" [class.reading]="test.skill === 'Reading'">{{ test.skill }}</span></td>
              <td>{{ test.source }}</td>
              <td>{{ test.parts.length }}</td>
              <td>{{ getQuestionCount(test) }}</td>
              <td class="actions">
                <button class="btn-icon" [routerLink]="['/admin/tests', test.id, 'edit']" title="Edit">✏️</button>
                <button class="btn-icon" (click)="deleteTest(test.id)" title="Delete">🗑️</button>
                <button class="btn-icon" (click)="downloadTest(test)" title="Download">⬇️</button>
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
    this.testDataService.getTests().subscribe(tests => {
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
}
