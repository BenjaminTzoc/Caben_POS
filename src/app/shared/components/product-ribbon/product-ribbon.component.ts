import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { Product } from '../../../inventory/interfaces/product.interface';
import { QuickQuantityService } from '../../../sales/services/quick-quantity.service';
import { ThemeService } from '../../../core/services/theme.service';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

@Component({
  selector: 'app-product-ribbon',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    ButtonModule,
    TooltipModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    InputGroupModule,
    InputGroupAddonModule
  ],
  templateUrl: './product-ribbon.component.html',
})
export class ProductRibbonComponent {
  public themeService = inject(ThemeService);
  private quickQuantityService = inject(QuickQuantityService);

  @ViewChild('catalogContainer') catalogContainer!: ElementRef<HTMLDivElement>;

  /** Lista de productos disponibles */
  @Input() products: Product[] = [];

  /** Indicador de estado de carga */
  @Input() loading = false;

  /** Título de la cabecera */
  @Input() title = 'Catálogo Rápido de Productos';

  /** Subtítulo descriptivo */
  @Input() subtitle = 'Haz clic en un producto para agregarlo';

  /** Mensaje cuando no hay productos o no se ha seleccionado sucursal */
  @Input() emptyMessage = 'Selecciona una sucursal activa para cargar los productos disponibles.';

  /** Mostrar precios en las tarjetas (por defecto true) */
  @Input() showPrice = true;

  /** Mostrar stock por sucursal (ocultar en catálogo global) */
  @Input() showStock = true;

  /** Mostrar atajo de cantidad (solo aplica en ventas/cotizaciones) */
  @Input() showQuickQuantity = true;

  /** Tarjetas más estrechas (p. ej. precios por cliente) */
  @Input() compactCards = false;

  /** Tooltip del clic en la tarjeta */
  @Input() selectTooltip = 'Clic para agregar a la lista';

  /** Función opcional para saber si un producto está seleccionado */
  @Input() isSelectedFn?: (productId: string) => boolean;

  /** Función opcional para obtener la cantidad actual agregada */
  @Input() getSelectedQuantityFn?: (productId: string) => number | undefined;

  /** Evento emitido al seleccionar un producto con la cantidad rápida configurada */
  @Output() productSelect = new EventEmitter<{ product: Product; quantity: number }>();

  searchQuery = '';

  get filteredProducts(): Product[] {
    if (!this.searchQuery) return this.products;
    const q = this.searchQuery.toLowerCase();
    return this.products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.sku && p.sku.toLowerCase().includes(q))
    );
  }

  scrollCatalog(direction: 'left' | 'right' | number): void {
    if (this.catalogContainer?.nativeElement) {
      const container = this.catalogContainer.nativeElement;
      let amount = 0;
      if (typeof direction === 'number') {
        amount = direction;
      } else {
        const firstCard = container.firstElementChild as HTMLElement;
        if (firstCard) {
          const cardWidthWithGap = firstCard.offsetWidth + 12;
          amount = (direction === 'left' ? -1 : 1) * (cardWidthWithGap * 3);
        } else {
          amount = (direction === 'left' ? -1 : 1) * container.clientWidth;
        }
      }
      container.scrollBy({ left: amount, behavior: 'smooth' });
    }
  }

  getQuickQuantity(productId: string): number | undefined {
    return this.quickQuantityService.peekQuantity(productId);
  }

  onQuickQuantityChange(productId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input) return;
    const raw = input.value.trim();
    if (raw === '') {
      this.quickQuantityService.resetQuantity(productId);
      return;
    }
    const value = parseFloat(raw);
    if (!isNaN(value) && value > 0) {
      this.quickQuantityService.setQuantity(productId, value);
    }
  }

  onProductClick(product: Product, qtyInput?: HTMLInputElement): void {
    const qty = this.getQuickQuantity(product.id) || 1;
    this.quickQuantityService.resetQuantity(product.id);
    this.productSelect.emit({ product, quantity: qty });
    queueMicrotask(() => {
      if (!qtyInput) return;
      qtyInput.value = '';
      qtyInput.focus();
    });
  }

  isProductSelected(productId: string): boolean {
    if (this.isSelectedFn) return this.isSelectedFn(productId);
    return false;
  }

  cardClasses(product: Product): string {
    const isDark = this.themeService.isDarkMode();
    let selected = '';
    if (this.isProductSelected(product.id)) {
      selected = isDark 
        ? 'border-[#58A6FF] bg-[#1C2D42]/60 shadow-xs ring-1 ring-[#58A6FF]/40' 
        : 'border-[#48021C] bg-[#48021C]/5 shadow-xs ring-1 ring-[#48021C]/30';
    } else {
      selected = isDark 
        ? 'border-[#30363D] bg-[#0D1117] hover:bg-[#161B22] hover:border-slate-500 hover:shadow-xs' 
        : 'border-[#48021C]/20 bg-rose-50/20 hover:bg-white hover:border-[#48021C]/50 hover:shadow-xs';
    }

    const size = this.compactCards
      ? 'w-[calc((100%-2.25rem)/4)] min-w-[192px] max-w-[250px]'
      : 'w-[calc((100%-1.5rem)/3)] min-w-[210px] max-w-[320px]';
    return `${selected} ${size}`;
  }

  getSelectedQuantity(productId: string): number | undefined {
    if (this.getSelectedQuantityFn) return this.getSelectedQuantityFn(productId);
    return undefined;
  }

  getProductImageUrl(imageUrl?: string): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }
}
