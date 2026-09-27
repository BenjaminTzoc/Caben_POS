import { Injectable, signal } from '@angular/core';
import { ConfirmationType } from '../components/confirmation-modal/confirmation-modal.component';

export interface ConfirmOptions {
  header?: string;
  title?: string;
  message: string;
  note?: string;
  type?: ConfirmationType;
  icon?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmIcon?: string;
  accept?: () => void;
  reject?: () => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly visible = signal(false);
  readonly header = signal('Confirmación');
  readonly title = signal('¿Estás seguro de continuar?');
  readonly message = signal('');
  readonly note = signal('');
  readonly type = signal<ConfirmationType>('warning');
  readonly icon = signal<string | undefined>(undefined);
  readonly confirmLabel = signal('Confirmar');
  readonly cancelLabel = signal('Cancelar');
  readonly confirmIcon = signal('pi pi-check');
  readonly loading = signal(false);

  private acceptFn?: () => void;
  private rejectFn?: () => void;

  confirm(options: ConfirmOptions): void {
    this.header.set(options.header || 'Confirmación');
    if (options.title) {
      this.title.set(options.title);
      this.message.set(options.message);
    } else {
      this.title.set(options.message);
      this.message.set('');
    }
    this.note.set(options.note || '');
    this.type.set(options.type || 'warning');
    this.icon.set(options.icon);
    this.confirmLabel.set(options.confirmLabel || 'Confirmar');
    this.cancelLabel.set(options.cancelLabel || 'Cancelar');
    this.confirmIcon.set(options.confirmIcon || 'pi pi-check');
    this.loading.set(false);
    this.acceptFn = options.accept;
    this.rejectFn = options.reject;
    this.visible.set(true);
  }

  onConfirm(): void {
    const accept = this.acceptFn;
    this.acceptFn = undefined;
    this.rejectFn = undefined;
    this.visible.set(false);
    accept?.();
  }

  onCancel(): void {
    const reject = this.rejectFn;
    this.acceptFn = undefined;
    this.rejectFn = undefined;
    this.visible.set(false);
    reject?.();
  }
}
