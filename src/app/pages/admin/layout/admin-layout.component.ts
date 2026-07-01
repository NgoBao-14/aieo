import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-shell">
      <!-- SIDEBAR -->
      <aside class="admin-sidebar">
        <!-- Logo -->
        <div class="admin-logo">
          <div class="logo-circle">
            <span>IM</span>
          </div>
          <div class="logo-text">
            <strong>Ielts9s</strong>
            <span>Admin Control</span>
          </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="admin-menu">
          <!-- Group 1 -->
          <div class="menu-group">
            <span class="group-label">Chức năng thuê hệ thống</span>
            <div class="group-items">
              <a class="menu-item" routerLink="/admin/dashboard" routerLinkActive="active">
                <span class="icon">⚙️</span> Cấu hình hệ thống
              </a>
            </div>
          </div>

          <!-- Group 2 -->
          <div class="menu-group">
            <span class="group-label">Ielts9S</span>
            <div class="group-items">
              <a class="menu-item" routerLink="/admin/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                <span class="icon">🏠</span> Hybrid - Mode
              </a>
              <a class="menu-item" routerLink="/admin/tests/new" routerLinkActive="active">
                <span class="icon">➕</span> Thêm Đề LR
              </a>
              <a class="menu-item" routerLink="/admin/tests" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                <span class="icon">🔮</span> Thêm Đề Dự Đoán
              </a>
              <a class="menu-item" routerLink="/admin/tests" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                <span class="icon">✏️</span> Thêm Đề Writing
              </a>
            </div>
          </div>

          <!-- Group 3 -->
          <div class="menu-group">
            <span class="group-label">Nâng cấp Gói</span>
            <div class="group-items">
              <a class="menu-item" routerLink="/admin/upgrade" routerLinkActive="active">
                <span class="icon">💎</span> Nâng cấp tài khoản
              </a>
              <a class="menu-item" routerLink="/admin/dashboard" routerLinkActive="active">
                <span class="icon">🏷️</span> Mã giảm giá
              </a>
              <a class="menu-item" routerLink="/admin/dashboard" routerLinkActive="active">
                <span class="icon">🔑</span> Mã kích hoạt
              </a>
            </div>
          </div>

          <!-- Group 4 -->
          <div class="menu-group">
            <span class="group-label">Từ vựng</span>
            <div class="group-items">
              <a class="menu-item" routerLink="/vocabulary" target="_blank">
                <span class="icon">📚</span> Danh sách từ vựng
              </a>
            </div>
          </div>
        </nav>

        <!-- Logout -->
        <div class="admin-logout-wrap">
          <button class="logout-btn" (click)="logout()">
            <span class="icon">🚪</span> Đăng xuất
          </button>
        </div>
      </aside>

      <!-- MAIN WORKSPACE -->
      <main class="admin-workspace">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
  constructor(private authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
