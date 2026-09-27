import { Component } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { MessageService } from 'primeng/api';
import { ConfirmService } from '../../shared/services/confirm.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-home',
  imports: [ButtonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  constructor(
    private authService: AuthService,
    private messageService: MessageService,
    private confirmService: ConfirmService
  ) {}

  confirmLogout(): void {
    this.confirmService.confirm({
      message: '¿Estás seguro de que deseas cerrar sesión?',
      header: 'Confirmar cierre de sesión',
      icon: 'pi pi-exclamation-triangle',
      confirmLabel: 'Sí, salir',
      cancelLabel: 'Cancelar',
      type: 'danger',
      accept: () => {
        this.performLogout();
      },
      reject: () => {
        // Opcional: Mensaje de cancelación
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'Cierre de sesión cancelado',
          life: 2000,
        });
      },
    });
  }

  private performLogout(): void {
    this.authService.logout();

    this.messageService.add({
      severity: 'success',
      summary: 'Sesión cerrada',
      detail: 'Has salido de tu cuenta exitosamente',
      life: 3000,
    });
  }
}
