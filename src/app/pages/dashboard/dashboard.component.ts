import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppUser, Submission, UserProfile } from '../../models/app.models';
import { AuthService } from '../../core/services/auth.service';
import { TestDataService } from '../../core/services/test-data.service';
import { UserProfileService } from '../../core/services/user-profile.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  user: AppUser | null = null;
  profile: UserProfile | null = null;
  recentSubmissions: Submission[] = [];
  loading = true;
  seeding = false;

  readonly rankLabels: Record<UserProfile['rank'], string> = {
    novice: 'Novice',
    scout: 'Scout',
    knight: 'Knight',
    master: 'Master'
  };

  constructor(
    private authService: AuthService,
    private userProfileService: UserProfileService,
    private testDataService: TestDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    void this.loadDashboard();
  }

  private async loadDashboard(): Promise<void> {
    this.user = this.authService.currentUser;

    if (!this.user) {
      await this.router.navigate(['/']);
      return;
    }

    this.profile = await this.userProfileService.getUserProfile(this.user.uid);
    this.recentSubmissions = await this.testDataService.getRecentUserSubmissions(this.user.uid);
    this.loading = false;
  }

  get skillRows(): Array<{ label: string; value: number }> {
    if (!this.profile) {
      return [];
    }

    return [
      { label: 'Reading - Matching Headings', value: this.profile.stats.reading['Matching Headings'] ?? 0 },
      { label: 'Reading - Gap Fill', value: this.profile.stats.reading['Gap Fill'] ?? 0 },
      { label: 'Listening - Multiple Choice', value: this.profile.stats.listening['Multiple Choice'] ?? 0 },
      { label: 'Listening - Gap Fill', value: this.profile.stats.listening['Gap Fill'] ?? 0 }
    ];
  }

  practice(skill?: string): void {
    this.router.navigate(['/exercises'], {
      queryParams: skill ? { skill } : {}
    });
  }

  async seedDemoTests(): Promise<void> {
    if (this.seeding) {
      return;
    }

    this.seeding = true;
    try {
      await this.testDataService.seedDemoTestsToFirebase();
      alert('Đã seed đề mẫu lên Firebase.');
    } catch (error) {
      console.error('Seed demo tests failed:', error);
      alert('Seed đề mẫu thất bại. Kiểm tra Firebase config/quyền Firestore rồi thử lại.');
    } finally {
      this.seeding = false;
    }
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigate(['/']);
  }
}
