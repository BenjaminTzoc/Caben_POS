import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

export type BadgeSeverity =
  | 'success'
  | 'danger'
  | 'warn'
  | 'warning'
  | 'info'
  | 'secondary'
  | 'burgundy'
  | 'purple'
  | 'contrast'
  | string;

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css'
})
export class StatusBadgeComponent {
  public themeService = inject(ThemeService);

  @Input() value?: string | number | null = '';
  @Input() icon?: string = '';
  @Input() severity: BadgeSeverity = 'info';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' = 'sm';
  @Input() rounded: boolean = true;
  @Input() showDot: boolean = true;
  @Input() customClass: string = '';

  get dotClass(): string {
    const isDark = this.themeService.isDarkMode();
    const dotColorClasses: Record<string, string> = {
      success: isDark ? 'bg-emerald-400' : 'bg-emerald-600',
      danger: isDark ? 'bg-rose-400' : 'bg-rose-600',
      warn: isDark ? 'bg-amber-400' : 'bg-amber-600',
      warning: isDark ? 'bg-amber-400' : 'bg-amber-600',
      info: isDark ? 'bg-sky-400' : 'bg-sky-600',
      secondary: isDark ? 'bg-slate-400' : 'bg-slate-500',
      slate: isDark ? 'bg-slate-400' : 'bg-slate-500',
      burgundy: isDark ? 'bg-[#58A6FF]' : 'bg-[#48021C]',
      purple: isDark ? 'bg-purple-400' : 'bg-purple-600',
      contrast: isDark ? 'bg-slate-900' : 'bg-white'
    };

    const dotSizeClasses: Record<string, string> = {
      xs: 'w-1.5 h-1.5',
      sm: 'w-2 h-2',
      md: 'w-2.5 h-2.5',
      lg: 'w-3 h-3'
    };

    const normalizedSeverity = (this.severity || 'info').toLowerCase();
    const color = dotColorClasses[normalizedSeverity] || dotColorClasses['info'];
    const size = dotSizeClasses[this.size] || 'w-1.5 h-1.5';

    return `rounded-full flex-shrink-0 ${size} ${color}`;
  }

  get badgeClasses(): string {
    const isDark = this.themeService.isDarkMode();
    const sizeClasses = {
      xs: 'text-[10px] px-2 py-0.5 gap-1',
      sm: 'text-xs px-2.5 py-1 gap-1.5',
      md: 'text-sm px-3 py-1.5 gap-1.5',
      lg: 'text-base px-3.5 py-2 gap-2'
    }[this.size] || 'text-xs px-2.5 py-1 gap-1.5';

    const colorClasses: Record<string, string> = isDark ? {
      success: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60',
      danger: 'bg-rose-950/50 text-rose-300 border-rose-800/60',
      warn: 'bg-amber-950/50 text-amber-300 border-amber-800/60',
      warning: 'bg-amber-950/50 text-amber-300 border-amber-800/60',
      info: 'bg-sky-950/50 text-sky-300 border-sky-800/60',
      secondary: 'bg-[#1C2128] text-slate-300 border-[#30363D]',
      slate: 'bg-[#1C2128] text-slate-300 border-[#30363D]',
      burgundy: 'bg-[#1C2D42] text-[#58A6FF] border-[#58A6FF]/30',
      purple: 'bg-purple-950/50 text-purple-300 border-purple-800/60',
      contrast: 'bg-slate-100 text-slate-900 border-white'
    } : {
      success: 'bg-[#dcfce7] text-[#14532d] border-emerald-600/35',
      danger: 'bg-[#ffe4e6] text-[#9f1239] border-rose-600/35',
      warn: 'bg-[#fef3c7] text-[#92400e] border-amber-600/35',
      warning: 'bg-[#fef3c7] text-[#92400e] border-amber-600/35',
      info: 'bg-[#e0f2fe] text-[#075985] border-sky-600/35',
      secondary: 'bg-[#f1f5f9] text-[#334155] border-slate-600/25',
      slate: 'bg-[#f1f5f9] text-[#334155] border-slate-600/25',
      burgundy: 'bg-[#48021C]/10 text-[#48021C] border-[#48021C]/25',
      purple: 'bg-[#f3e8ff] text-[#581c87] border-purple-600/35',
      contrast: 'bg-[#1e293b] text-white border-[#0f172a]'
    };

    const normalizedSeverity = (this.severity || 'info').toLowerCase();
    const colorStyle = colorClasses[normalizedSeverity] || colorClasses['info'];

    return `inline-flex items-center justify-center font-semibold border transition-all ${this.rounded ? 'rounded-md' : 'rounded-none'} ${sizeClasses} ${colorStyle} ${this.customClass}`.trim();
  }
}
