import { Component, EventEmitter, Input, Output, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ThemeService } from '../../../core/services/theme.service';

export type ConfirmationType = 'warning' | 'danger' | 'success' | 'info' | 'primary';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  templateUrl: './confirmation-modal.component.html',
  styleUrl: './confirmation-modal.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class ConfirmationModalComponent {
  public themeService = inject(ThemeService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() header = 'Confirmación';
  @Input() title = '¿Estás seguro de continuar?';
  @Input() message = '';
  @Input() note?: string = '';
  @Input() type: ConfirmationType = 'warning';
  @Input() icon?: string;

  @Input() confirmLabel = 'Confirmar';
  @Input() cancelLabel = 'Cancelar';
  @Input() confirmIcon = 'pi pi-check';
  @Input() loading = false;
  @Input() width = '460px';

  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  private confirmed = false;

  get computedIcon(): string {
    if (this.icon) return this.icon;
    switch (this.type) {
      case 'danger':
        return 'pi pi-trash';
      case 'success':
        return 'pi pi-check-circle';
      case 'info':
        return 'pi pi-info-circle';
      case 'primary':
        return 'pi pi-exclamation-circle';
      case 'warning':
      default:
        return 'pi pi-exclamation-triangle';
    }
  }

  get iconContainerClasses(): string {
    switch (this.type) {
      case 'danger':
        return 'bg-rose-50 border-rose-100 text-rose-500';
      case 'success':
        return 'bg-emerald-50 border-emerald-100 text-emerald-600';
      case 'info':
        return 'bg-blue-50 border-blue-100 text-blue-600';
      case 'primary':
        return 'bg-[#48021C]/10 border-[#48021C]/20 text-[#48021C]';
      case 'warning':
      default:
        return 'bg-amber-50 border-amber-100 text-amber-500';
    }
  }

  get confirmButtonClasses(): string {
    switch (this.type) {
      case 'danger':
        return '!bg-rose-600 hover:!bg-rose-700 !border-rose-600 !text-white';
      case 'success':
        return '!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 !text-white';
      case 'info':
        return '!bg-blue-600 hover:!bg-blue-700 !border-blue-600 !text-white';
      case 'primary':
        return '!bg-[#48021C] hover:!bg-[#350114] !border-[#48021C] !text-white';
      case 'warning':
      default:
        return '!bg-amber-600 hover:!bg-amber-700 !border-amber-600 !text-white';
    }
  }

  get chromeClasses(): string {
    switch (this.type) {
      case 'danger':
        return 'bg-rose-50/70 border-rose-200';
      case 'success':
        return 'bg-emerald-50/70 border-emerald-200';
      case 'info':
        return 'bg-blue-50/70 border-blue-200';
      case 'primary':
        return 'bg-rose-50/60 border-[#48021C]/15';
      case 'warning':
      default:
        return 'bg-amber-50/70 border-amber-200';
    }
  }

  get closeButtonClasses(): string {
    switch (this.type) {
      case 'danger':
        return 'bg-rose-100/80 hover:bg-rose-200 text-rose-700 border-rose-200 hover:border-rose-300';
      case 'success':
        return 'bg-emerald-100/80 hover:bg-emerald-200 text-emerald-700 border-emerald-200 hover:border-emerald-300';
      case 'info':
        return 'bg-blue-100/80 hover:bg-blue-200 text-blue-700 border-blue-200 hover:border-blue-300';
      case 'primary':
        return 'bg-[#48021C]/10 hover:bg-[#48021C]/20 text-[#48021C] border-[#48021C]/20 hover:border-[#48021C]/40';
      case 'warning':
      default:
        return 'bg-amber-100/80 hover:bg-amber-200 text-amber-700 border-amber-200 hover:border-amber-300';
    }
  }

  handleClose(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  handleConfirm(): void {
    this.confirmed = true;
    this.onConfirm.emit();
  }

  onDialogHide(): void {
    const wasConfirm = this.confirmed;
    this.confirmed = false;
    if (this.visible) {
      this.visible = false;
      this.visibleChange.emit(false);
    }
    if (!wasConfirm) {
      this.onCancel.emit();
    }
  }
}
