import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-danger-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './danger-button.component.html',
})
export class DangerButtonComponent {
  public themeService = inject(ThemeService);

  /** Texto del botón (ej. 'Cerrar Sesión', 'Eliminar', etc.) */
  @Input() label = 'Cerrar Sesión';

  /** Icono de PrimeIcons (ej. 'pi pi-sign-out', 'pi pi-trash') */
  @Input() icon: string = 'pi pi-sign-out';

  /** Estado de deshabilitado */
  @Input() disabled = false;

  /** Estado de carga */
  @Input() loading = false;

  /** Clases adicionales opcionales */
  @Input() customClass = '';

  /** Evento emitido al hacer clic */
  @Output() clicked = new EventEmitter<void>();

  onClick(): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit();
    }
  }
}
