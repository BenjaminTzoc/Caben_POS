import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ICustomerCategory } from '../../interfaces/customer.interface';
import { CustomerCategoriesService } from '../../services/customer-categories.service';
import { StandardModalComponent } from '../../../shared/components/standard-modal/standard-modal.component';
import { StandardTableComponent } from '../../../shared/components/standard-table/standard-table.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-customer-categories-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    ToggleSwitchModule,
    TooltipModule,
    CurrencyPipe,
    DecimalPipe,
    StandardModalComponent,
    StandardTableComponent,
    SearchInputComponent,
    PrimaryButtonComponent,
    StatusBadgeComponent,
    ConfirmationModalComponent,
  ],
  templateUrl: './customer-categories-modal.component.html',
})
export class CustomerCategoriesModalComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() categoriesChanged = new EventEmitter<ICustomerCategory[]>();

  public themeService = inject(ThemeService);
  private categoriesService = inject(CustomerCategoriesService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);

  categories: ICustomerCategory[] = [];
  filtered: ICustomerCategory[] = [];
  loading = false;
  searchTerm = '';
  view: 'list' | 'form' = 'list';
  isSaving = false;
  editingId: string | null = null;
  categoryForm!: FormGroup;

  showDeleteModal = false;
  categoryToDelete: ICustomerCategory | null = null;
  deleting = false;

  constructor() {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(255)]],
      discountPercentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      minPurchaseAmount: [0, [Validators.required, Validators.min(0)]],
      defaultCreditLimit: [0, [Validators.required, Validators.min(0)]],
      isActive: [true],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.view = 'list';
      this.searchTerm = '';
      this.loadCategories();
    }
  }

  get modalTitle(): string {
    if (this.view === 'form') {
      return this.editingId ? 'Editar categoría' : 'Nueva categoría';
    }
    return 'Categorías de cliente';
  }

  get modalBadge(): string {
    if (this.view === 'form') return this.editingId ? 'Edición' : 'Nuevo';
    const n = this.categories.length;
    return n === 1 ? '1 registro' : `${n} registros`;
  }

  get deleteMessage(): string {
    const name = this.categoryToDelete?.name || 'esta categoría';
    return `Se eliminará "${name}". Los clientes que la usen quedarán sin categoría.`;
  }

  loadCategories(): void {
    this.loading = true;
    this.categoriesService.getCategories().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.categories = res.data ?? [];
          this.applyFilter();
          this.categoriesChanged.emit(this.categories);
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudieron cargar las categorías',
        });
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.applyFilter();
  }

  private applyFilter(): void {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) {
      this.filtered = [...this.categories];
      return;
    }
    this.filtered = this.categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q),
    );
  }

  openCreate(): void {
    this.editingId = null;
    this.categoryForm.reset({
      name: '',
      description: '',
      discountPercentage: 0,
      minPurchaseAmount: 0,
      defaultCreditLimit: 0,
      isActive: true,
    });
    this.view = 'form';
  }

  openEdit(category: ICustomerCategory): void {
    this.editingId = category.id;
    this.categoryForm.reset({
      name: category.name,
      description: category.description || '',
      discountPercentage: Number(category.discountPercentage || 0),
      minPurchaseAmount: Number(category.minPurchaseAmount || 0),
      defaultCreditLimit: Number(category.defaultCreditLimit || 0),
      isActive: category.isActive !== false,
    });
    this.view = 'form';
  }

  backToList(): void {
    this.view = 'list';
    this.editingId = null;
  }

  onSave(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const values = this.categoryForm.value;
    const request = this.editingId
      ? this.categoriesService.updateCategory(this.editingId, values)
      : this.categoriesService.createCategory(values);

    request.subscribe({
      next: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Categoría ${this.editingId ? 'actualizada' : 'creada'} correctamente`,
          });
          this.view = 'list';
          this.editingId = null;
          this.loadCategories();
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudo guardar la categoría',
        });
        this.isSaving = false;
      },
      complete: () => {
        this.isSaving = false;
      },
    });
  }

  askDelete(category: ICustomerCategory): void {
    this.categoryToDelete = category;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.categoryToDelete) return;
    this.deleting = true;
    this.categoriesService.deleteCategory(this.categoryToDelete.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'La categoría se ha eliminado correctamente.',
        });
        this.showDeleteModal = false;
        this.categoryToDelete = null;
        this.deleting = false;
        this.loadCategories();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudo eliminar la categoría',
        });
        this.deleting = false;
      },
    });
  }

  onToggleActive(category: ICustomerCategory, isActive: boolean): void {
    if (category.isActive === isActive) return;
    this.categoriesService.updateCategory(category.id, { isActive }).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          category.isActive = isActive;
          this.messageService.add({
            severity: 'success',
            summary: 'Actualizado',
            detail: `Categoría ${category.name} ${isActive ? 'activada' : 'desactivada'}`,
          });
          this.categoriesChanged.emit(this.categories);
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cambiar el estado de la categoría',
        });
      },
    });
  }

  onVisibleChange(visible: boolean): void {
    this.visible = visible;
    this.visibleChange.emit(visible);
    if (!visible) {
      this.view = 'list';
    }
  }
}
