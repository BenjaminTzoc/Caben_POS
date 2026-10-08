import {
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
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
  TopProductItemDto,
  TopProductsKpisDto,
  TopProductsSummaryDto,
} from '../../../../core/models/reports.models';

interface CalendarCell {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  key: string;
}

@Component({
  selector: 'app-top-products-widget',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TooltipModule,
    StatusBadgeComponent,
  ],
  templateUrl: './top-products-widget.component.html',
  styleUrl: './top-products-widget.component.css',
})
export class TopProductsWidgetComponent {
  private reportsService = inject(ReportsService);
  private dashboardFilter = inject(DashboardFilterService);
  public themeService = inject(ThemeService);
  private host = inject(ElementRef<HTMLElement>);

  // Estado del calendario y navegación
  viewMonth = signal<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  rangeStart = signal<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  rangeEnd = signal<Date>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  calOpen = signal(false);

  // Filtros
  search = signal('');
  sortBy = signal<'revenue' | 'quantity'>('revenue');
  limit = signal<number>(10);
  selectedProduct = signal<TopProductItemDto | null>(null);

  // Datos
  products = signal<TopProductItemDto[]>([]);
  kpis = signal<TopProductsKpisDto | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Temporal para selección de rango en calendario
  private selectingStart = signal<Date | null>(null);

  monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  yearsList = computed(() => {
    const curYear = new Date().getFullYear();
    const list: number[] = [];
    for (let y = curYear; y >= curYear - 5; y--) {
      list.push(y);
    }
    return list;
  });

  currentMonthYearLabel = computed(() => {
    const month = this.viewMonth();
    const name = month.toLocaleDateString('es-GT', { month: 'long' });
    return `${name.charAt(0).toUpperCase() + name.slice(1)} ${month.getFullYear()}`;
  });

  dateRangeLabel = computed(() => {
    const s = this.rangeStart();
    const e = this.rangeEnd();
    return `${this.formatDisplayDate(s)} - ${this.formatDisplayDate(e)}`;
  });

  calendarGrid = computed<CalendarCell[]>(() => {
    const monthDate = this.viewMonth();
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const cells: CalendarCell[] = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      cells.push({
        date: d,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        key: this.toKey(d),
      });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      cells.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: true,
        key: this.toKey(d),
      });
    }

    const totalCells = cells.length <= 35 ? 35 : 42;
    let nextMonthDay = 1;
    while (cells.length < totalCells) {
      const d = new Date(year, month + 1, nextMonthDay++);
      cells.push({
        date: d,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        key: this.toKey(d),
      });
    }

    return cells;
  });

  filteredProducts = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.products();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.productName.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        (p.sku?.toLowerCase().includes(q) ?? false)
    );
  });

  emptySlots = computed(() => {
    const used = this.filteredProducts().length === 0 ? 1 : this.filteredProducts().length;
    return Array.from({ length: Math.max(0, 5 - used) }, (_, i) => i);
  });

  sparkMax = computed(() => {
    const p = this.selectedProduct();
    if (!p || !p.sparkline.length) return 1;
    return Math.max(...p.sparkline.map((d) => (this.sortBy() === 'revenue' ? d.total : d.quantity)), 1);
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
    const startStr = this.toKey(this.rangeStart());
    const endStr = this.toKey(this.rangeEnd());

    this.reportsService
      .getTopProductsSummary(
        startStr,
        endStr,
        this.dashboardFilter.branchId() || undefined,
        this.limit(),
        this.sortBy()
      )
      .subscribe({
        next: (res) => {
          const data: TopProductsSummaryDto = res.data;
          this.products.set(data.products || []);
          this.kpis.set(data.kpis);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.products.set([]);
          this.kpis.set(null);
          this.errorMessage.set(
            err?.error?.message || 'Error al obtener productos más comprados'
          );
          this.isLoading.set(false);
        },
      });
  }

  toggleCal(event: Event): void {
    event.stopPropagation();
    this.calOpen.update((open) => !open);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.calOpen()) return;
    const anchor = this.host.nativeElement.querySelector('.cal-anchor-prod');
    if (anchor?.contains(event.target as Node)) return;
    this.calOpen.set(false);
  }

  shiftMonth(offset: number): void {
    const current = this.viewMonth();
    const next = new Date(current.getFullYear(), current.getMonth() + offset, 1);
    this.viewMonth.set(next);
  }

  onMonthSelect(mIndex: number): void {
    const cur = this.viewMonth();
    this.viewMonth.set(new Date(cur.getFullYear(), mIndex, 1));
  }

  onYearSelect(year: number): void {
    const cur = this.viewMonth();
    this.viewMonth.set(new Date(year, cur.getMonth(), 1));
  }

  applyCurrentMonth(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.viewMonth.set(start);
    this.rangeStart.set(start);
    this.rangeEnd.set(end);
    this.calOpen.set(false);
    this.loadData();
  }

  applyLastMonth(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    this.viewMonth.set(start);
    this.rangeStart.set(start);
    this.rangeEnd.set(end);
    this.calOpen.set(false);
    this.loadData();
  }

  applyLast30Days(): void {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    this.viewMonth.set(new Date(end.getFullYear(), end.getMonth(), 1));
    this.rangeStart.set(start);
    this.rangeEnd.set(end);
    this.calOpen.set(false);
    this.loadData();
  }

  onCellClick(cell: CalendarCell): void {
    const date = cell.date;
    const start = this.selectingStart();

    if (!start) {
      this.selectingStart.set(date);
    } else {
      if (date < start) {
        this.rangeStart.set(date);
        this.rangeEnd.set(start);
      } else {
        this.rangeStart.set(start);
        this.rangeEnd.set(date);
      }
      this.selectingStart.set(null);
      this.calOpen.set(false);
      this.loadData();
    }
  }

  isCellSelected(date: Date): boolean {
    const s = this.rangeStart();
    const e = this.rangeEnd();
    return this.toKey(date) >= this.toKey(s) && this.toKey(date) <= this.toKey(e);
  }

  isCellRangeEdge(date: Date): boolean {
    return this.isSameDay(date, this.rangeStart()) || this.isSameDay(date, this.rangeEnd());
  }

  isCellRangeStart(date: Date): boolean {
    return this.isSameDay(date, this.rangeStart());
  }

  isCellRangeEnd(date: Date): boolean {
    return this.isSameDay(date, this.rangeEnd());
  }

  setSortBy(val: 'revenue' | 'quantity'): void {
    if (this.sortBy() === val) return;
    this.sortBy.set(val);
    this.loadData();
  }

  setLimit(val: number): void {
    this.limit.set(val);
    this.loadData();
  }

  selectProduct(p: TopProductItemDto): void {
    this.selectedProduct.set(p);
  }

  closeDetail(): void {
    this.selectedProduct.set(null);
  }

  barHeight(val: number): number {
    const max = this.sparkMax();
    if (!max || max <= 0) return 0;
    return Math.min(100, Math.max(5, Math.round((val / max) * 100)));
  }

  // Helpers
  private toKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private isSameDay(d1: Date, d2: Date): boolean {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  private formatDisplayDate(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
