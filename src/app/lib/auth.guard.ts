import {Injectable} from '@angular/core';
import {Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';

import {AuthService} from '../services/auth.service';
import { map, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    constructor(
        private router: Router,
        private authService: AuthService
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        const currentUser = this.authService.currentUserValue;

        if (route.data.is_admin && route.data.is_admin === true) {
            // If the route requires admin privileges
            return this.authService.checkAdminPrivilege(currentUser.username).pipe(
                tap(isAdmin => {
                    const currentUser = this.authService.currentUserValue;
                }),
                map(isAdmin => {
                    if (isAdmin) {
                        return true; // User is an admin, grant access to admin page
                    } else {
                        this.router.navigate(['/unauthorized']); // Redirect non-admin users
                        return false;
                    }
                })
            );
        } else {
            // For pages that require any logged-in user
            if (currentUser) {
                // authorised so return true
                return true;
            }
            // not logged in so redirect to login page with the return url
            this.router.navigate(['/login'], { queryParams: { returnUrl: state.url }});
            return false;
        }
    }
}
