import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';
import { DecompositionService } from '../../services/decomposition.service';
import { IDecompositionResponse } from '../../interfaces/decomposition.interface';
import { ThemeService } from '../../../core/services/theme.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { SecondaryButtonComponent } from '../../../shared/components/secondary-button/secondary-button.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-decomposition-detail',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    ButtonModule,
    TableModule,
    TagModule,
    PageHeaderComponent,
    PrimaryButtonComponent,
    SecondaryButtonComponent,
  ],
  templateUrl: './decomposition-detail.component.html',
})
export class DecompositionDetailComponent implements OnInit {
  public themeService = inject(ThemeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private decompositionService = inject(DecompositionService);
  private messageService = inject(MessageService);

  decomposition = signal<IDecompositionResponse | null>(null);
  loading = signal<boolean>(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDecomposition(id);
    } else {
      this.router.navigate(['/production/decomposition']);
    }
  }

  loadDecomposition(id: string): void {
    this.loading.set(true);
    this.decompositionService.getDecomposition(id).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.decomposition.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el detalle del despiece',
        });
        this.loading.set(false);
        this.router.navigate(['/production/decomposition']);
      },
    });
  }

  onBack(): void {
    this.router.navigate(['/production/decomposition']);
  }

  printDecomposition(): void {
    window.print();
  }

  getYieldPercentage(): number {
    const decomp = this.decomposition();
    if (!decomp || decomp.inputQuantity <= 0) return 0;
    const outputWeight = (decomp.items || []).reduce((acc, item) => acc + item.quantity, 0);
    return (outputWeight / decomp.inputQuantity) * 100;
  }

  getProductImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }
}
