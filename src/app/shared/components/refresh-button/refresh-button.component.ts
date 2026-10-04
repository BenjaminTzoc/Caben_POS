import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-refresh-button',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './refresh-button.component.html',
})
export class RefreshButtonComponent {
  public themeService = inject(ThemeService);

  /** Estado de carga que hace girar únicamente el icono sin mostrar un spinner que reemplace el botón */
  @Input() loading = false;

  /** Texto del botón (por defecto 'Actualizar') */
  @Input() label = 'Actualizar';

  /** Esquema de color: 'burgundy' (por defecto), 'navy', 'slate' */
  @Input() colorScheme: 'burgundy' | 'navy' | 'slate' = 'burgundy';

  /** Evento emitido al hacer click */
  @Output() refresh = new EventEmitter<void>();

  get buttonStyleClass(): string {
    const isDark = this.themeService.isDarkMode();
    const base = '!rounded-lg text-sm! font-semibold active:scale-[0.98] inline-flex items-center gap-1.5 transition-all duration-200 shadow-xs cursor-pointer disabled:!opacity-50';

    if (isDark) {
      return `${base} !bg-[#1C2128] !border !border-[#30363D] !text-[#F0F6FC] hover:!bg-[#30363D] hover:!border-slate-500`;
    }

    const lightBase = `${base} !bg-white/70 backdrop-blur-md`;
    switch (this.colorScheme) {
      case 'navy':
        return `${lightBase} !border !border-[#1e3a5f]/20 !text-[#1e3a5f] hover:!bg-white hover:!border-[#1e3a5f]/40 hover:!shadow-md hover:!shadow-slate-900/5`;
      case 'slate':
        return `${lightBase} !border !border-slate-300/80 !text-slate-700 hover:!bg-white hover:!border-slate-400 hover:!shadow-md hover:!shadow-slate-900/5`;
      case 'burgundy':
      default:
        return `${lightBase} !border !border-[#48021C]/20 !text-[#48021C] hover:!bg-white hover:!border-[#48021C]/40 hover:!shadow-md hover:!shadow-rose-950/5`;
    }
  }

  get iconClass(): string {
    if (this.themeService.isDarkMode()) {
      return 'text-[#58A6FF]';
    }
    switch (this.colorScheme) {
      case 'navy': return 'text-[#1e3a5f]';
      case 'slate': return 'text-slate-500';
      case 'burgundy':
      default:
        return 'text-[#48021C]';
    }
  }

  onClick(): void {
    if (!this.loading) {
      this.refresh.emit();
    }
  }
}
