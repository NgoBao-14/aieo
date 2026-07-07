import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TestDataService } from '../../../core/services/test-data.service';
import { Test } from '../../../models/app.models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <h1>Admin Dashboard</h1>
        <p>Manage IELTS test library</p>
      </div>

      <div class="dashboard-grid">
        <article class="dashboard-card">
          <span class="label">Total Tests</span>
          <strong class="value">{{ (totalTests$ | async) || 0 }}</strong>
        </article>

        <article class="dashboard-card">
          <span class="label">Reading Tests</span>
          <strong class="value">{{ (readingTests$ | async)?.length || 0 }}</strong>
        </article>

        <article class="dashboard-card">
          <span class="label">Listening Tests</span>
          <strong class="value">{{ (listeningTests$ | async)?.length || 0 }}</strong>
        </article>

        <article class="dashboard-card">
          <span class="label">Total Questions</span>
          <strong class="value">{{ totalQuestions }}</strong>
        </article>
      </div>

      <section class="dashboard-section">
        <h2>Quick Actions</h2>
        <div class="action-buttons">
          <button class="btn btn--primary" routerLink="/admin/tests/new">➕ Create New Test</button>
          <button class="btn btn--ghost" routerLink="/admin/tests/new">📤 Import from Excel</button>
          <button class="btn btn--ghost" routerLink="/admin/tests">📋 Manage Tests</button>
        </div>
      </section>
    </div>
  `,
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  totalTests$ = new Observable<number>();
  readingTests$ = new Observable<Test[]>();
  listeningTests$ = new Observable<Test[]>();
  totalQuestions = 0;

  constructor(private testDataService: TestDataService) {}

  ngOnInit() {
    this.readingTests$ = this.testDataService.getTests({ skill: 'Reading', preferCloud: true });
    this.listeningTests$ = this.testDataService.getTests({ skill: 'Listening', preferCloud: true });

    this.testDataService.getTests({ preferCloud: true }).subscribe(tests => {
      let total = 0;
      tests.forEach(test => {
        test.parts.forEach(part => {
          part.questionGroups.forEach(group => {
            total += group.questions.length;
          });
        });
      });
      this.totalQuestions = total;
    });
  }
}
