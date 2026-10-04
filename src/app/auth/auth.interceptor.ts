import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  let messageService: MessageService | null = null;
  try {
    messageService = inject(MessageService, { optional: true });
  } catch (e) {
    // Si no está provisto a nivel root
  }

  // Excluir endpoints de autenticación
  if (req.url.endsWith('/users/login')) {
    return next(req);
  }

  const token = authService.token;
  let authReq = req;

  if (token) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401 && !req.url.endsWith('/users/login')) {
        authService.logout();
      } else if (error.status === 403) {
        if (messageService) {
          messageService.add({
            severity: 'warn',
            summary: 'Acceso Denegado',
            detail: 'No tienes permisos suficientes para realizar esta acción.',
            life: 5000,
          });
        }
      }
      return throwError(() => error);
    })
  );
};