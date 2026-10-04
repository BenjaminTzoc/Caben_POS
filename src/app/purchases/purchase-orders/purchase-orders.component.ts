import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { IPurchaseOrderResponse } from '../interfaces/purchase-order.interface';
import { OrdersService } from '../services/orders.service';
import { MessageService } from 'primeng/api';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { PurchaseStatusPipe } from '../../shared/pipes/purchase-status.pipe';
import { BranchesService } from '../../inventory/services/branches.service';
import { Branch } from '../../inventory/interfaces/branch.interface';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../auth/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RefreshButtonComponent } from '../../shared/components/refresh-button/refresh-button.component';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { SecondaryButtonComponent } from '../../shared/components/secondary-button/secondary-button.component';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { StandardTableComponent } from '../../shared/components/standard-table/standard-table.component';
import { StatusBadgeComponent, BadgeSeverity } from '../../shared/components/status-badge/status-badge.component';
import { StandardModalComponent } from '../../shared/components/standard-modal/standard-modal.component';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    CurrencyPipe,
    PurchaseStatusPipe,
    Select,
    TooltipModule,
    PageHeaderComponent,
    RefreshButtonComponent,
    PrimaryButtonComponent,
    SecondaryButtonComponent,
    SearchInputComponent,
    StandardTableComponent,
    StatusBadgeComponent,
    StandardModalComponent,
  ],
  templateUrl: './purchase-orders.component.html',
  styleUrl: './purchase-orders.component.css',
})
export class PurchaseOrdersComponent implements OnInit {
  public themeService = inject(ThemeService);
  private ordersService = inject(OrdersService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private branchesService = inject(BranchesService);
  private authService = inject(AuthService);

  purchaseOrders = signal<IPurchaseOrderResponse[]>([]);
  branches = signal<Branch[]>([]);
  loading = signal<boolean>(false);
  searchTerm = signal<string>('');
  statusFilter = signal<string | null>(null);

  statusOptions = [
    { label: 'Todos los estados', value: null },
    { label: 'Pendiente', value: 'pending' },
    { label: 'Parcialmente Recibida', value: 'partially_received' },
    { label: 'Recibida', value: 'received' },
    { label: 'Cancelada', value: 'cancelled' },
  ];

  filteredOrders = computed(() => {
    let list = this.purchaseOrders();
    const search = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();

    if (status) {
      list = list.filter((o) => o.status === status);
    }
    if (search) {
      list = list.filter(
        (o) =>
          (o.invoiceNumber && o.invoiceNumber.toLowerCase().includes(search)) ||
          (o.supplier?.name && o.supplier.name.toLowerCase().includes(search)) ||
          (o.supplier?.nit && o.supplier.nit.toLowerCase().includes(search))
      );
    }
    return list;
  });

  // Recepcion logic
  showReceiveDialog = signal<boolean>(false);
  currentOrderToReceive = signal<IPurchaseOrderResponse | null>(null);
  selectedBranchId = signal<string | null>(null);
  receivingStock = signal<boolean>(false);

  ngOnInit(): void {
    this.loadPurchaseOrders();
    this.loadBranches();
  }

  loadBranches(): void {
    this.branchesService.getBranches().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.branches.set(res.data);
          // Pre-select if only 1 branch or based on user (logic can be refined)
          if (res.data.length === 1) {
            this.selectedBranchId.set(res.data[0].id);
          }
        }
      },
    });
  }

  loadPurchaseOrders(): void {
    this.loading.set(true);

    this.ordersService.getPurchases().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.purchaseOrders.set(res.data);
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error cargando los productos: ${err.error.message}`,
        });
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  createPurchaseOrder(): void {
    this.router.navigate(['/purchases/new-order']);
  }

  openReceiveDialog(order: IPurchaseOrderResponse): void {
    this.currentOrderToReceive.set(order);
    this.showReceiveDialog.set(true);
  }

  confirmReceive(): void {
    const order = this.currentOrderToReceive();
    const branchId = this.selectedBranchId();

    if (!order || !branchId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Debe seleccionar una sucursal para recibir.',
      });
      return;
    }

    this.receivingStock.set(true);
    this.ordersService.receiveStock(order.id, branchId).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'El stock ha sido recibido correctamente.',
          });
          this.showReceiveDialog.set(false);
          this.loadPurchaseOrders();
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error al recibir el stock: ${err.error?.message || err.message}`,
        });
      },
      complete: () => {
        this.receivingStock.set(false);
      },
    });
  }

  getStatusSeverity(status: string): BadgeSeverity {
    switch (status) {
      case 'received': return 'success';
      case 'pending': return 'warn';
      case 'partially_received': return 'info';
      case 'OPEN': return 'info';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  }

  hasPendingAmount(amount: string | number | undefined): boolean {
    if (!amount) return false;
    return Number(amount) > 0;
  }
}
