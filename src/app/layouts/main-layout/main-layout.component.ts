import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AppUser } from '../../models/app.models';
import { AuthService } from '../../core/services/auth.service';
import { ProgressService } from '../../core/services/progress.service';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit {
  readonly user$: Observable<AppUser | null> = this.authService.user$;

  currentSessionId = 0;
  streak = 0;
  bandEstimate = 0;
  mobileMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private progressService: ProgressService
  ) {}

  ngOnInit(): void {
    const p = this.progressService.getProgress();
    this.currentSessionId = p.currentSessionId;
    this.streak = p.streak;
    this.bandEstimate = p.bandEstimate;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  async login(): Promise<void> {
    await this.authService.loginWithGoogle();
    await this.router.navigate(['/dashboard']);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigate(['/']);
  }
}
