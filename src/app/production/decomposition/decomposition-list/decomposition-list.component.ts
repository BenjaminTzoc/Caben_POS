import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';
import { DecompositionService } from '../../services/decomposition.service';
import { IDecompositionResponse } from '../../interfaces/decomposition.interface';
import { ThemeService } from '../../../core/services/theme.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { RefreshButtonComponent } from '../../../shared/components/refresh-button/refresh-button.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { FormsModule } from '@angular/forms';
import { StandardTableComponent } from '../../../shared/components/standard-table/standard-table.component';

@Component({
  selector: 'app-decomposition-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    ButtonModule,
    TooltipModule,
    PageHeaderComponent,
    PrimaryButtonComponent,
    RefreshButtonComponent,
    SearchInputComponent,
    StandardTableComponent,
  ],
  templateUrl: './decomposition-list.component.html',
})
export class DecompositionListComponent implements OnInit {
  public themeService = inject(ThemeService);
  private decompositionService = inject(DecompositionService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  decompositions = signal<IDecompositionResponse[]>([]);
  loading = signal<boolean>(false);
  searchTerm = signal<string>('');

  filteredDecompositions = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.decompositions();
    if (!term) return list;

    return list.filter((decomp) => {
      const productName = decomp.inputProduct?.name?.toLowerCase() || '';
      const productSku = decomp.inputProduct?.sku?.toLowerCase() || '';
      const branchName = decomp.branch?.name?.toLowerCase() || '';
      return (
        productName.includes(term) ||
        productSku.includes(term) ||
        branchName.includes(term)
      );
    });
  });

  ngOnInit(): void {
    this.loadDecompositions();
  }

  loadDecompositions(): void {
    this.loading.set(true);
    this.decompositionService.getDecompositions().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.decompositions.set(res.data);
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los despieces',
        });
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  onSearch(query: string): void {
    this.searchTerm.set(query);
  }

  createDecomposition(): void {
    this.router.navigate(['/production/decomposition/new']);
  }

  viewDetail(id: string): void {
    this.router.navigate(['/production/decomposition/detail', id]);
  }

  getProductImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }

  getYieldPercentage(decomp: IDecompositionResponse): number {
    const input = Number(decomp.inputQuantity) || 0;
    const waste = Number(decomp.wasteQuantity) || 0;
    if (input <= 0) return 0;
    return ((input - waste) / input) * 100;
  }
}
