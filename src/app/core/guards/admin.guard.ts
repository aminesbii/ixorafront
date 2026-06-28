import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    if (!this.authService.isLoggedIn()) {
      return this.router.parseUrl('/auth/login');
    }

    if (!this.authService.isAdminOrManager()) {
      return this.router.parseUrl('/');
    }

    const user = this.authService.getCurrentUser();
    if (user?.role === 'ADMIN') {
      return true;
    }

    const requiredPerm = route.data?.['permission'] as string | undefined;
    if (requiredPerm) {
      const perms = user?.permissions || [];
      if (!perms.includes(requiredPerm)) {
        if (perms.length > 0) {
          return this.router.parseUrl(`/dashboard/${perms[0]}`);
        } else {
          return this.router.parseUrl('/');
        }
      }
    }

    return true;
  }
}
