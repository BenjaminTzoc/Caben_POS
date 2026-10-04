import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { RefreshButtonComponent } from '../../../shared/components/refresh-button/refresh-button.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { StandardTableComponent } from '../../../shared/components/standard-table/standard-table.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { BranchSelectComponent } from '../../../shared/components/branch-select/branch-select.component';
import { BranchSettlementsService } from '../../services/branch-settlements.service';
import { BranchSettlement, BranchSettlementStatus } from '../../interfaces/branch-settlement.interface';
import { AuthService } from '../../../auth/auth.service';
import { BranchesService } from '../../../inventory/services/branches.service';
import { Branch } from '../../../inventory/interfaces/branch.interface';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-settlements',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    DecimalPipe,
    SelectModule,
    PageHeaderComponent,
    PrimaryButtonComponent,
    RefreshButtonComponent,
    SearchInputComponent,
    StandardTableComponent,
    StatusBadgeComponent,
    BranchSelectComponent,
  ],
  templateUrl: './settlements.component.html',
  styleUrl: './settlements.component.css',
})
export class SettlementsComponent implements OnInit {
  public themeService = inject(ThemeService);
  private api = inject(BranchSettlementsService);
  private auth = inject(AuthService);
  private branchesApi = inject(BranchesService);
  private router = inject(Router);

  loading = signal(false);
  rows = signal<BranchSettlement[]>([]);
  searchTerm = signal('');
  selectedStatus = signal<BranchSettlementStatus | null>(null);
  selectedBranchId = signal<string | null>(null);
  branches: Branch[] = [];

  statusOptions = [
    { label: 'Enviada', value: 'submitted' as BranchSettlementStatus },
    { label: 'Recibida', value: 'received' as BranchSettlementStatus },
    { label: 'Faltante en tránsito', value: 'discrepancy' as BranchSettlementStatus },
  ];

  filteredRows = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const rows = this.rows();
    if (!term) return rows;
    return rows.filter(
      (row) =>
        (row.settlementNumber || '').toLowerCase().includes(term) ||
        (row.branchName || '').toLowerCase().includes(term),
    );
  });

  get isSuperAdmin(): boolean {
    return this.auth.isSuperAdmin;
  }

  ngOnInit(): void {
    if (this.isSuperAdmin) {
      this.branchesApi.getBranches({ minimal: true }).subscribe({
        next: (res) => (this.branches = res.data || []),
      });
    }
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list(this.selectedBranchId() || undefined, this.selectedStatus() || undefined).subscribe({
      next: (res) => {
        this.rows.set(res.data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  onStatusChange(value: BranchSettlementStatus | null): void {
    this.selectedStatus.set(value);
    this.load();
  }

  onBranchChange(value: string | null): void {
    this.selectedBranchId.set(value);
    this.load();
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'draft':
        return 'Borrador';
      case 'submitted':
        return 'Enviada';
      case 'received':
        return 'Recibida';
      case 'discrepancy':
        return 'Faltante en tránsito';
      default:
        return status;
    }
  }

  statusSeverity(status: string): 'secondary' | 'info' | 'success' | 'danger' {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'submitted':
        return 'info';
      case 'received':
        return 'success';
      case 'discrepancy':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  returnTotal(row: BranchSettlement): number {
    return (row.items || []).reduce((sum, item) => sum + Number(item.returnQty || 0), 0);
  }

  wasteTotal(row: BranchSettlement): number {
    return (row.items || []).reduce((sum, item) => sum + Number(item.wasteQty || 0), 0);
  }

  goToToday(): void {
    this.router.navigate(['/logistics/settlements/today']);
  }

  goToDetail(row: BranchSettlement): void {
    this.router.navigate(['/logistics/settlements', row.id]);
  }
}
