import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BranchContextService } from '../core/services/branch-context.service';

/**
 * Guard que asegura que una ruta solo sea accesible cuando se trabaja en Modo Global (Todas las sucursales).
 * Si hay una sucursal activa específica seleccionada, bloquea el acceso y redirige al dashboard.
 */
export const globalOnlyGuard: CanActivateFn = () => {
  const branchContext = inject(BranchContextService);
  const router = inject(Router);

  // Si está en modo global, permitir acceso
  if (branchContext.isGlobalView) {
    return true;
  }

  // Si hay una sucursal específica fijada, redirigir al dashboard
  router.navigate(['/dashboard']);
  return false;
};
