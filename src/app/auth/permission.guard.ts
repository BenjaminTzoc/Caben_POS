import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const permissionGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isSuperAdmin) {
    return true;
  }

  const requiredPermission = route.data?.['permission'] as string | undefined;
  const requiredPermissions = route.data?.['permissions'] as string[] | undefined;

  if (requiredPermission && authService.hasPermission(requiredPermission)) {
    return true;
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    if (authService.hasAnyPermission(requiredPermissions)) {
      return true;
    }
  }

  if (!requiredPermission && (!requiredPermissions || requiredPermissions.length === 0)) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};