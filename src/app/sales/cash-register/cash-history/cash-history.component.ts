import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CashRegisterService } from '../../../inventory/services/cash-register.service';
import { CashSession } from '../../../inventory/interfaces/cash-register.interface';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { RefreshButtonComponent } from '../../../shared/components/refresh-button/refresh-button.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { StandardTableComponent } from '../../../shared/components/standard-table/standard-table.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-cash-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    PageHeaderComponent,
    RefreshButtonComponent,
    SearchInputComponent,
    StandardTableComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './cash-history.component.html',
})
export class CashHistoryComponent implements OnInit {
  private cashService = inject(CashRegisterService);
  private router = inject(Router);

  history = signal<CashSession[]>([]);
  isLoadingHistory = signal(false);
  searchTerm = signal('');

  filteredHistory = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const rows = this.history();
    if (!term) return rows;
    return rows.filter(
      (session) =>
        (session.branchName || '').toLowerCase().includes(term) ||
        (session.userName || '').toLowerCase().includes(term),
    );
  });

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.isLoadingHistory.set(true);
    this.cashService.getHistory().subscribe({
      next: (res) => {
        this.history.set(res.data ?? []);
        this.isLoadingHistory.set(false);
      },
      error: () => this.isLoadingHistory.set(false),
    });
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  goBack(): void {
    this.router.navigate(['/sales/cash-register']);
  }

  differenceAmount(session: CashSession): number {
    return session.difference ?? 0;
  }

  differenceTone(session: CashSession): 'exact' | 'over' | 'short' {
    const amount = this.differenceAmount(session);
    if (amount === 0) return 'exact';
    return amount > 0 ? 'over' : 'short';
  }

  differenceLabel(session: CashSession): string {
    if (session.status !== 'CLOSED') return '';
    const tone = this.differenceTone(session);
    if (tone === 'exact') return 'Exacto';
    return tone === 'over' ? 'Sobrante' : 'Faltante';
  }
}
