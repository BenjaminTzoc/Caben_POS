import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Supplier } from '../../interfaces/supplier.interface';
import { SelectModule } from 'primeng/select';
import { CreatePurchase, IPurchaseOrderResponse } from '../../interfaces/purchase-order.interface';
import { OrdersService } from '../../services/orders.service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { SuppliersService } from '../../services/suppliers.service';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { environment } from '../../../../environments/environment';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { WebsocketService } from '../../services/websocket.service';
import { Subject, takeUntil } from 'rxjs';
import { TagModule } from 'primeng/tag';
import { ProductsService } from '../../../inventory/services/products.service';
import { Product } from '../../../inventory/interfaces/product.interface';
import { ThemeService } from '../../../core/services/theme.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { SecondaryButtonComponent } from '../../../shared/components/secondary-button/secondary-button.component';
import { StandardModalComponent } from '../../../shared/components/standard-modal/standard-modal.component';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { ProductRibbonComponent } from '../../../shared/components/product-ribbon/product-ribbon.component';
import { ProductsTableComponent, QuotationItem } from '../../../shared/components/products-table/products-table.component';

export enum PurchaseStatus {
  PENDING = 'pending',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Component({
  selector: 'app-purchase-order-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    TextareaModule,
    SelectModule,
    CurrencyPipe,
    TableModule,
    InputNumberModule,
    ToggleSwitchModule,
    TagModule,
    TooltipModule,
    PageHeaderComponent,
    PrimaryButtonComponent,
    SecondaryButtonComponent,
    StandardModalComponent,
    ConfirmationModalComponent,
    ProductRibbonComponent,
    ProductsTableComponent,
  ],
  templateUrl: './purchase-order-form.component.html',
  styleUrl: './purchase-order-form.component.css',
})
export class PurchaseOrderFormComponent implements OnInit, OnDestroy {
  public themeService = inject(ThemeService);
  private fb = inject(FormBuilder);
  private ordersService = inject(OrdersService);
  private suppliersService = inject(SuppliersService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private websocketService = inject(WebsocketService);
  private destroy$ = new Subject<void>();

  orderForm!: FormGroup;
  productForm!: FormGroup;
  suppliers: Supplier[] = [];
  purchaseData: IPurchaseOrderResponse = {} as IPurchaseOrderResponse;

  // Lista estandarizada de ítems para ProductsTableComponent
  tableItems: QuotationItem[] = [];
  applyTax: boolean = false;
  loadingProducts = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  showCancelConfirmModal = false;

  dialogVisible: boolean = false;
  products = signal<Product[]>([]);
  selectedProduct: Product | undefined = undefined;

  ngOnInit(): void {
    this.initializeForm();
    this.loadSuppliers();
    this.loadProducts();
    this.setupWebSocketListeners();
    this.ordersService.getNextInvoiceNumber().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.purchaseData.invoiceNumber = res.data.nextNumber;
          this.orderForm.get('invoiceNumber')?.setValue(this.purchaseData.invoiceNumber);
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error generando número de orden: ${err.error.message}`,
        });
        this.router.navigate(['/purchases/orders']);
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupWebSocketListeners(): void {
    this.websocketService
      .onNewPurchaseCreated()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.messageService.add({
          severity: 'info',
          summary: 'Nueva orden creada',
          detail: `Otro usuario creó la orden: ${data.data.invoiceNumber}`,
          life: 5000,
        });

        this.loadNextInvoiceNumber();
      });

    this.websocketService
      .onNextInvoiceNumberUpdated()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        const newNumber = data.data.nextInvoiceNumber;

        if (this.orderForm.get('invoiceNumber')?.value !== newNumber) {
          this.orderForm.get('invoiceNumber')?.setValue(newNumber);

          this.messageService.add({
            severity: 'success',
            summary: 'Número actualizado',
            detail: `Nuevo número de orden: ${newNumber}`,
            life: 3000,
          });
        }
      });
  }

  loadNextInvoiceNumber(): void {
    this.ordersService.getNextInvoiceNumber().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.orderForm.get('invoiceNumber')?.setValue(res.data.nextNumber);
        }
      },
      error: (err) => {
        console.error('Error cargando número de orden:', err);
      },
    });
  }

  initializeForm(): void {
    this.orderForm = this.fb.group({
      invoiceNumber: ['', [Validators.required]],
      date: [new Date(), [Validators.required]],
      dueDate: [null],
      notes: [''],
      status: [''],
      supplierId: ['', [Validators.required]],
    });

    this.productForm = this.fb.group({
      productId: ['', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.min(0)]],
    });
  }

  loadSuppliers(): void {
    this.suppliersService.getSuppliers().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.suppliers = res.data;
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error obteniendo proveedores: ${err.error.message}`,
        });
        this.router.navigate(['/purchases/orders']);
      },
    });
  }

  loadProducts(): void {
    this.loadingProducts.set(true);
    this.productsService.getProducts(undefined, false, undefined, undefined, false).subscribe({
      next: (res) => {
        this.loadingProducts.set(false);
        if (res.statusCode === 200) {
          this.products.set(res.data);
        }
      },
      error: (err) => {
        this.loadingProducts.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error obteniendo productos: ${err.error.message}`,
        });
      },
    });
  }

  // Integración con ProductRibbonComponent
  isProductSelected = (productId: string): boolean => {
    return this.tableItems.some((item) => item.productId === productId);
  };

  getItemQuantity = (productId: string): number | undefined => {
    const item = this.tableItems.find((i) => i.productId === productId);
    return item ? item.quantity : undefined;
  };

  onProductSelectFromRibbon(event: { product: Product; quantity: number }): void {
    const qty = event.quantity || 1;
    const existingIndex = this.tableItems.findIndex((i) => i.productId === event.product.id);

    if (existingIndex > -1) {
      this.tableItems[existingIndex].quantity += qty;
    } else {
      this.tableItems.push({
        productId: event.product.id,
        sku: event.product.sku || '',
        name: event.product.name,
        imageUrl: event.product.imageUrl,
        price: Number(event.product.price || 0),
        quantity: qty,
        discount: 0,
        discountType: 'percentage',
        maxStock: event.product.stock ?? 0,
        unitName: event.product.unit?.name || '',
        unitAbbreviation: event.product.unit?.abbreviation || 'un',
        allowsDecimals: event.product.unit?.allowsDecimals ?? false,
        isAvailable: event.product.isAvailable,
        isUnlimited: true,
      });
    }

    this.tableItems = [...this.tableItems];
    const unitAbbr = event.product.unit?.abbreviation ? ` ${event.product.unit.abbreviation}` : '';
    this.messageService.add({
      severity: 'success',
      summary: 'Producto Añadido',
      detail: `${event.product.name} (+${qty}${unitAbbr}) agregado a la orden`,
      life: 2500,
    });
  }

  // Integración con ProductsTableComponent
  onTableItemChange(event: { index: number; item: QuotationItem }): void {
    this.tableItems[event.index] = event.item;
    this.tableItems = [...this.tableItems];
  }

  removeDetail(index: number): void {
    this.tableItems.splice(index, 1);
    this.tableItems = [...this.tableItems];
  }

  clearAllItems(): void {
    this.tableItems = [];
  }

  // Cálculo reactivo de totales para la orden de compra
  get calculatedTotals(): {
    subtotal: number;
    discountTotal: number;
    subtotalWithDiscount: number;
    taxTotal: number;
    total: number;
  } {
    let subtotal = 0;
    let discountTotal = 0;

    for (const item of this.tableItems) {
      const lineGross = (item.quantity || 0) * (item.price || 0);
      let disc = 0;
      if (item.discountType === 'percentage') {
        disc = (lineGross * (item.discount || 0)) / 100;
      } else {
        disc = item.discount || 0;
      }
      subtotal += lineGross;
      discountTotal += disc;
    }

    const subtotalWithDiscount = Math.max(0, subtotal - discountTotal);
    const taxTotal = this.applyTax ? Number((subtotalWithDiscount * 0.12).toFixed(2)) : 0;
    const total = Number((subtotalWithDiscount + taxTotal).toFixed(2));

    return {
      subtotal: Number(subtotal.toFixed(2)),
      discountTotal: Number(discountTotal.toFixed(2)),
      subtotalWithDiscount: Number(subtotalWithDiscount.toFixed(2)),
      taxTotal,
      total,
    };
  }

  onSupplierChange(event: any): void {
    const selectedSupplierId = event.value;
    if (!selectedSupplierId) {
      this.purchaseData.supplier = undefined;
      return;
    }

    this.suppliersService.getSupplier(selectedSupplierId).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.purchaseData.supplier = res.data;
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error obteniendo datos del proveedor: ${err.error.message}`,
        });
      },
    });
  }

  showDialog(): void {
    this.dialogVisible = true;
  }

  onProductChange(event: any): void {
    const selectedProductId = event.value;

    if (!selectedProductId) {
      this.selectedProduct = undefined;
      return;
    }

    this.productsService.getProduct(selectedProductId).subscribe({
      next: (response) => {
        if (response.statusCode === 200) {
          this.selectedProduct = response.data;
          this.productForm.get('unitPrice')?.setValue(Number(this.selectedProduct.price || 0));
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error cargando el producto: ${error.error.message}`,
        });
      },
    });
  }

  addDetail(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, completa todos los campos requeridos',
      });
      return;
    }

    const formValue = this.productForm.value;
    const existingIndex = this.tableItems.findIndex((i) => i.productId === formValue.productId);

    if (existingIndex > -1) {
      this.tableItems[existingIndex].quantity += Number(formValue.quantity);
      this.tableItems[existingIndex].price = Number(formValue.unitPrice);
      this.tableItems[existingIndex].discount = Number(formValue.discount || 0);
    } else {
      this.tableItems.push({
        productId: formValue.productId,
        sku: this.selectedProduct?.sku || '',
        name: this.selectedProduct?.name || 'Producto',
        imageUrl: this.selectedProduct?.imageUrl,
        price: Number(formValue.unitPrice || 0),
        quantity: Number(formValue.quantity || 1),
        discount: Number(formValue.discount || 0),
        discountType: 'percentage',
        maxStock: this.selectedProduct?.stock ?? 0,
        unitName: this.selectedProduct?.unit?.name || '',
        unitAbbreviation: this.selectedProduct?.unit?.abbreviation || 'un',
        allowsDecimals: this.selectedProduct?.unit?.allowsDecimals ?? false,
        isAvailable: this.selectedProduct?.isAvailable,
        isUnlimited: true,
      });
    }

    this.tableItems = [...this.tableItems];
    this.productForm.reset({
      quantity: 1,
      unitPrice: 0,
      discount: 0,
    });
    this.selectedProduct = undefined;
    this.dialogVisible = false;

    this.messageService.add({
      severity: 'success',
      summary: 'Producto Añadido',
      detail: 'Producto agregado al detalle de la orden',
      life: 2500,
    });
  }

  onSaveOrder(): void {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, completa todos los campos requeridos (Proveedor y No. Factura)',
      });
      return;
    }

    if (this.tableItems.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe agregar al menos un producto a la orden de compra',
      });
      return;
    }

    this.isSaving.set(true);

    const formData: CreatePurchase = {
      invoiceNumber: this.orderForm.get('invoiceNumber')?.value,
      date: new Date(this.orderForm.get('date')?.value),
      dueDate: this.orderForm.get('dueDate')?.value
        ? new Date(this.orderForm.get('dueDate')?.value)
        : undefined,
      supplierId: this.orderForm.get('supplierId')?.value,
      notes: this.orderForm.get('notes')?.value,
      details: this.tableItems.map((item) => {
        const lineGross = (item.quantity || 0) * (item.price || 0);
        const discAmount = item.discountType === 'percentage'
          ? (lineGross * (item.discount || 0)) / 100
          : (item.discount || 0);
        const net = Math.max(0, lineGross - discAmount);
        const taxRate = this.applyTax ? 12 : 0;
        const taxAmount = (net * taxRate) / 100;

        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
          discount: item.discount || 0,
          discountAmount: Number(discAmount.toFixed(2)),
          taxPercentage: taxRate,
          taxAmount: Number(taxAmount.toFixed(2)),
        };
      }),
    };

    this.ordersService.createPurchase(formData).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.statusCode === 201) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Orden de compra creada correctamente',
          });
          this.router.navigate(['/purchases/orders']);
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error creando orden: ${err.error.message}`,
        });
      },
    });
  }

  onBack(): void {
    this.router.navigate(['/purchases/orders']);
  }

  confirmCancelProcess(): void {
    if (this.tableItems.length > 0 || this.orderForm.get('supplierId')?.value) {
      this.showCancelConfirmModal = true;
    } else {
      this.onBack();
    }
  }

  getProductImageUrl(imageUrl: string | null): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;

    return `${environment.baseUrl}${imageUrl}`;
  }
}
