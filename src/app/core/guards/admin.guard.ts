import { Injectable } from '@angular/core';
import { CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

// TODO: Implement proper admin role check
// For now, allow all logged-in users. In production, check admin flag in user profile.

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivateChild {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    const user = this.authService.currentUser;

    if (!user) {
      this.router.navigate(['/']);
      return false;
    }

    // TODO: Check user.role === 'admin' from Firebase user profile
    // For now, allow all logged-in users
    console.warn('⚠️ Admin Guard: Using permissive mode. Implement role-based access in production!');

    return true;
  }
}
