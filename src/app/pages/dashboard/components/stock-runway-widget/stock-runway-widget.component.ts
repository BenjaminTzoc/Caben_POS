import {
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { ReportsService } from '../../../../core/services/reports.service';
import { DashboardFilterService } from '../../dashboard-filter.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import {
  StockRunwayItemDto,
  StockRunwayKpisDto,
  StockRunwayResponseDto,
} from '../../../../core/models/reports.models';

@Component({
  selector: 'app-stock-runway-widget',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TooltipModule,
    StatusBadgeComponent,
  ],
  templateUrl: './stock-runway-widget.component.html',
  styleUrl: './stock-runway-widget.component.css',
})
export class StockRunwayWidgetComponent {
  private reportsService = inject(ReportsService);
  private dashboardFilter = inject(DashboardFilterService);
  public themeService = inject(ThemeService);

  // Filtros
  search = signal('');
  velocityDays = signal<number>(14);
  limit = signal<number>(10);
  riskFilter = signal<'all' | 'critical' | 'warning' | 'reorder'>('all');

  // Datos
  items = signal<StockRunwayItemDto[]>([]);
  kpis = signal<StockRunwayKpisDto | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  filteredItems = computed(() => {
    const q = this.search().trim().toLowerCase();
    const risk = this.riskFilter();
    let list = this.items();

    if (risk !== 'all') {
      list = list.filter((i) => i.riskLevel === risk);
    }

    if (!q) return list;
    return list.filter(
      (i) =>
        i.productName.toLowerCase().includes(q) ||
        i.categoryName.toLowerCase().includes(q) ||
        (i.sku?.toLowerCase().includes(q) ?? false)
    );
  });

  emptySlots = computed(() => {
    const used = this.filteredItems().length === 0 ? 1 : this.filteredItems().length;
    return Array.from({ length: Math.max(0, 5 - used) }, (_, i) => i);
  });

  constructor() {
    effect(() => {
      this.dashboardFilter.branchId();
      untracked(() => this.loadData());
    });
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.reportsService
      .getStockRunway(
        this.dashboardFilter.branchId() || undefined,
        this.velocityDays(),
        this.limit()
      )
      .subscribe({
        next: (res) => {
          const data: StockRunwayResponseDto = res.data;
          this.items.set(data.items || []);
          this.kpis.set(data.kpis);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.items.set([]);
          this.kpis.set(null);
          this.errorMessage.set(
            err?.error?.message || 'Error al obtener proyección de inventario'
          );
          this.isLoading.set(false);
        },
      });
  }

  setVelocityDays(days: number): void {
    if (this.velocityDays() === days) return;
    this.velocityDays.set(days);
    this.loadData();
  }

  setLimit(lim: number): void {
    if (this.limit() === lim) return;
    this.limit.set(lim);
    this.loadData();
  }

  setRiskFilter(filter: 'all' | 'critical' | 'warning' | 'reorder'): void {
    this.riskFilter.set(filter);
  }

  riskSeverity(level: string): 'danger' | 'warn' | 'info' | 'success' | 'secondary' {
    switch (level) {
      case 'critical':
        return 'danger';
      case 'warning':
        return 'warn';
      case 'reorder':
        return 'info';
      case 'healthy':
        return 'success';
      default:
        return 'secondary';
    }
  }
}
