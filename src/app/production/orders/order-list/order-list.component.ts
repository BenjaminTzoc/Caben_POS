import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { ProductionOrderService } from '../../services/production-order.service';
import { IProductionOrder, ProductionOrderStatus } from '../../interfaces/production-order.interface';
import { environment } from '../../../../environments/environment';
import { ThemeService } from '../../../core/services/theme.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { SecondaryButtonComponent } from '../../../shared/components/secondary-button/secondary-button.component';
import { RefreshButtonComponent } from '../../../shared/components/refresh-button/refresh-button.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { StandardTableComponent } from '../../../shared/components/standard-table/standard-table.component';
import { StatusBadgeComponent, BadgeSeverity } from '../../../shared/components/status-badge/status-badge.component';
import { StandardModalComponent } from '../../../shared/components/standard-modal/standard-modal.component';

@Component({
  selector: 'app-production-order-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ButtonModule,
    TooltipModule,
    InputNumberModule,
    FormsModule,
    PageHeaderComponent,
    PrimaryButtonComponent,
    SecondaryButtonComponent,
    RefreshButtonComponent,
    SearchInputComponent,
    StandardTableComponent,
    StatusBadgeComponent,
    StandardModalComponent,
  ],
  templateUrl: './order-list.component.html',
})
export class ProductionOrderListComponent implements OnInit {
  public themeService = inject(ThemeService);
  private productionService = inject(ProductionOrderService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  orders = signal<IProductionOrder[]>([]);
  loading = signal<boolean>(false);
  searchTerm = signal<string>('');

  // Completion Dialog
  showCompleteDialog = signal<boolean>(false);
  selectedOrder = signal<IProductionOrder | null>(null);
  actualQuantity = signal<number>(0);
  completingOrder = signal<boolean>(false);

  filteredOrders = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.orders();
    if (!term) return list;

    return list.filter((order) => {
      const productName = order.product?.name?.toLowerCase() || '';
      const productSku = order.product?.sku?.toLowerCase() || '';
      const branchName = order.branch?.name?.toLowerCase() || '';
      const statusLabel = this.getStatusLabel(order.status).toLowerCase();
      return (
        productName.includes(term) ||
        productSku.includes(term) ||
        branchName.includes(term) ||
        statusLabel.includes(term)
      );
    });
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.productionService.getOrders().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.orders.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las órdenes de producción',
        });
        this.loading.set(false);
      },
    });
  }

  onSearch(query: string): void {
    this.searchTerm.set(query);
  }

  createOrder(): void {
    this.router.navigate(['/production/orders/new']);
  }

  viewDetail(id: string): void {
    this.router.navigate(['/production/orders/detail', id]);
  }

  onComplete(order: IProductionOrder): void {
    this.selectedOrder.set(order);
    this.actualQuantity.set(order.plannedQuantity);
    this.showCompleteDialog.set(true);
  }

  confirmComplete(): void {
    const order = this.selectedOrder();
    if (!order) return;

    this.completingOrder.set(true);
    this.productionService
      .completeOrder(order.id, { actualQuantity: this.actualQuantity() })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Completada',
            detail: 'Orden de producción completada y stock actualizado.',
          });
          this.showCompleteDialog.set(false);
          this.loadOrders();
          this.completingOrder.set(false);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Error al completar la orden',
          });
          this.completingOrder.set(false);
        },
      });
  }

  getStatusSeverity(status: ProductionOrderStatus): BadgeSeverity {
    switch (status) {
      case 'pending':
        return 'warn';
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getStatusLabel(status: ProductionOrderStatus): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'in_progress':
        return 'En Proceso';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  }

  getProductImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }
}
