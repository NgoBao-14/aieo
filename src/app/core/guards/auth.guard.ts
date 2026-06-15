import { Injectable } from '@angular/core';
import { CanActivateChild, Router, UrlTree } from '@angular/router';
import { combineLatest, filter, map, Observable, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivateChild {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivateChild(): Observable<boolean | UrlTree> {
    return combineLatest([this.authService.user$, this.authService.loading$]).pipe(
      filter(([, loading]) => !loading),
      take(1),
      map(([user]) => user ? true : this.router.createUrlTree(['/']))
    );
  }
}
