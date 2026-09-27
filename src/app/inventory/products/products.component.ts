import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ConfirmService } from '../../shared/services/confirm.service';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { CurrencyPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ProductsService } from '../services/products.service';
import { Product } from '../interfaces/product.interface';
import { AuthService } from '../../auth/auth.service';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RefreshButtonComponent } from '../../shared/components/refresh-button/refresh-button.component';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { StandardTableComponent } from '../../shared/components/standard-table/standard-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-products',
  imports: [
    TableModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    CurrencyPipe,
    FormsModule,
    ToggleSwitchModule,
    CommonModule,
    TagModule,
    TooltipModule,
    PageHeaderComponent,
    RefreshButtonComponent,
    PrimaryButtonComponent,
    SearchInputComponent,
    StandardTableComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
})
export class ProductsComponent implements OnInit {
  @ViewChild('productsDesktopTable') productsDesktopTable?: StandardTableComponent;
  @ViewChild('productsMobileTable') productsMobileTable?: Table;

  private productsService = inject(ProductsService);
  private messageService = inject(MessageService);
  private confirmService = inject(ConfirmService);
  private router = inject(Router);
  private authService = inject(AuthService);

  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  loading = false;
  searchTerm = '';
  showDeleted = false;
  totalRecords = 0;
  page = 1;
  limit = 20;
  first = 0;
  private lastLoadKey = '';

  get canViewDeleted(): boolean {
    const user = this.authService.currentUser;
    if (!user) return false;
    return user.roles?.some((r) => r.isSuperAdmin || r.name === 'Admin') ?? false;
  }

  ngOnInit(): void {}

  expandedRows: { [key: string]: boolean } = {};

  onExpandedRowKeysChange(event: { [key: string]: boolean }) {
    this.expandedRows = event;
  }

  toggleRowExpansion(product: Product) {
    const id = product.id;
    this.expandedRows = {
      ...this.expandedRows,
      [id]: !this.expandedRows[id]
    };
  }

  onSearch(query: string): void {
    this.searchTerm = query;
    this.page = 1;
    this.first = 0;
    this.lastLoadKey = '';
    this.loadProducts();
  }

  onPageChange(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.limit;
    const first = event.first ?? 0;
    this.limit = rows;
    this.first = first;
    this.page = Math.floor(first / rows) + 1;
    this.loadProducts();
  }

  onToggleDeleted(): void {
    this.page = 1;
    this.first = 0;
    this.lastLoadKey = '';
    this.loadProducts();
  }

  loadProducts(branchId?: string): void {
    const key = `${this.page}|${this.limit}|${this.searchTerm}|${this.showDeleted}|${branchId || ''}`;
    if (key === this.lastLoadKey && this.loading) return;
    this.lastLoadKey = key;
    this.loading = true;
    this.productsService
      .getProductsPage(
        { page: this.page, limit: this.limit, search: this.searchTerm },
        { branchId, includeDeleted: this.showDeleted },
      )
      .subscribe({
        next: (response) => {
          const page = response.data;
          this.filteredProducts = (page.items || []).filter((p) => !p.isVariant);
          this.totalRecords = page.total ?? this.filteredProducts.length;
          this.page = page.page ?? this.page;
        },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error cargando los productos: ${error.error.message}`,
        });
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  isDeleted(product: Product): boolean {
    return (product as any).deletedAt != null;
  }

  onRestoreProduct(product: Product): void {
    this.confirmService.confirm({
      message: `¿Está seguro de restaurar el producto: ${product.name}?`,
      header: 'Confirmar restauración',
      confirmLabel: 'Restaurar',
      cancelLabel: 'Cancelar',
      type: 'success',
      accept: () => {
        this.productsService.restoreProduct(product.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Producto restaurado correctamente',
            });
            this.loadProducts();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo restaurar el producto',
            });
          },
        });
      },
    });
  }

  getProductImageUrl(imageUrl: string | null): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;

    return `${environment.baseUrl}${imageUrl}`;
  }

  goToNewProduct() {
    this.router.navigate(['inventory/new-product']);
  }

  onEditProduct(productId: string) {
    this.router.navigate(['inventory/edit-product', productId]);
  }

  onCreateVariant(parent: Product) {
    this.router.navigate(['inventory/new-product'], { 
      queryParams: { parentId: parent.id } 
    });
  }

  onDeleteProduct(product: Product) {
    this.confirmService.confirm({
      message: `¿Estás seguro de eliminar el producto: ${product.name}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-info-circle',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      type: 'danger',
      accept: () => {
        this.productsService.deleteProduct(product.id).subscribe({
          next: (response) => {
            if (response.statusCode === 200) {
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: `El producto se ha eliminado correctamente.`,
              });
              this.loadProducts();
            }
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error eliminando el producto: ${error.error.message}`,
              life: 5000,
            });
          },
        });
      },
      reject: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Cancelado',
          detail: 'Se ha cancelado la operación',
        });
      },
    });
  }

  getProductTypeLabel(type: string): string {
    switch (type) {
      case 'raw_material':
        return 'Materia Prima';
      case 'insumo':
        return 'Insumo';
      case 'component':
        return 'Componente';
      case 'finished_product':
        return 'Producto Terminado';
      default:
        return 'N/A';
    }
  }

  getTypeSeverity(type: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (type) {
      case 'raw_material':
        return 'contrast';
      case 'insumo':
        return 'info';
      case 'component':
        return 'warn';
      case 'finished_product':
        return 'success';
      default:
        return 'secondary';
    }
  }

  copyToClipboard(text: string, label: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.messageService.add({
        severity: 'info',
        summary: 'Copiado',
        detail: `${label} "${text}" copiado al portapapeles`,
        life: 2000,
      });
    });
  }
}
