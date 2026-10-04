import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Ripple } from 'primeng/ripple';

import { ProductsService } from '../../../inventory/services/products.service';
import { Product, ProductType } from '../../../inventory/interfaces/product.interface';
import { environment } from '../../../../environments/environment';
import { ThemeService } from '../../../core/services/theme.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { RefreshButtonComponent } from '../../../shared/components/refresh-button/refresh-button.component';
import { FormsModule } from '@angular/forms';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { StatusBadgeComponent, BadgeSeverity } from '../../../shared/components/status-badge/status-badge.component';
import { StandardTableComponent } from '../../../shared/components/standard-table/standard-table.component';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    Ripple,
    PageHeaderComponent,
    RefreshButtonComponent,
    SearchInputComponent,
    StatusBadgeComponent,
    StandardTableComponent,
  ],
  templateUrl: './recipe-list.component.html',
})
export class RecipeListComponent implements OnInit {
  public themeService = inject(ThemeService);
  private productsService = inject(ProductsService);
  private router = inject(Router);

  products = signal<Product[]>([]);
  loading = signal<boolean>(false);
  searchTerm = signal<string>('');
  expandedRows: { [key: string]: boolean } = {};
  mobileExpandedProducts = signal<Set<string>>(new Set<string>());

  toggleMobileVariants(productId: string): void {
    const current = new Set(this.mobileExpandedProducts());
    if (current.has(productId)) {
      current.delete(productId);
    } else {
      current.add(productId);
    }
    this.mobileExpandedProducts.set(current);
  }

  isMobileExpanded(productId: string): boolean {
    return this.mobileExpandedProducts().has(productId);
  }

  filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.products();
    if (!term) return list;

    return list.filter((p) => {
      const name = p.name?.toLowerCase() || '';
      const sku = p.sku?.toLowerCase() || '';
      const hasMatchingVariant = p.variants?.some(
        (v) => (v.name?.toLowerCase() || '').includes(term) || (v.sku?.toLowerCase() || '').includes(term)
      );
      return name.includes(term) || sku.includes(term) || hasMatchingVariant;
    });
  });

  onExpandedRowKeysChange(event: { [key: string]: boolean }) {
    this.expandedRows = event;
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.productsService.getProducts(undefined, false, undefined, undefined, undefined, 'raw_material,insumo').subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.products.set(res.data.filter((p: Product) => !p.isVariant));
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(query: string): void {
    this.searchTerm.set(query);
  }

  manageRecipe(productId: string): void {
    this.router.navigate(['/production/recipes/detail', productId]);
  }

  getProductImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }

  getTypeLabel(type?: string | ProductType): string {
    if (!type) return '---';
    switch (type) {
      case ProductType.FINISHED_PRODUCT:
        return 'Terminado';
      case ProductType.RAW_MATERIAL:
        return 'Materia Prima';
      case ProductType.INSUMO:
        return 'Insumo';
      case ProductType.COMPONENT:
        return 'Componente';
      default:
        return String(type);
    }
  }

  getTypeSeverity(type?: string | ProductType): BadgeSeverity {
    if (!type) return 'secondary';
    switch (type) {
      case ProductType.FINISHED_PRODUCT:
        return 'success';
      case ProductType.COMPONENT:
        return 'warn';
      case ProductType.RAW_MATERIAL:
        return 'info';
      case ProductType.INSUMO:
        return 'purple';
      default:
        return 'secondary';
    }
  }
}
