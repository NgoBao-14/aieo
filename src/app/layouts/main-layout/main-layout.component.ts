import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AppUser } from '../../models/app.models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {
  readonly user$: Observable<AppUser | null> = this.authService.user$;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async login(): Promise<void> {
    await this.authService.loginWithGoogle();
    await this.router.navigate(['/dashboard']);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigate(['/']);
  }
}
