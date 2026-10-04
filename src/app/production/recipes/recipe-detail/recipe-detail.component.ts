import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { RecipeService } from '../../services/recipe.service';
import { ProductsService } from '../../../inventory/services/products.service';
import { Product } from '../../../inventory/interfaces/product.interface';
import { IRecipeIngredient } from '../../interfaces/recipe.interface';
import { environment } from '../../../../environments/environment';
import { ThemeService } from '../../../core/services/theme.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { SecondaryButtonComponent } from '../../../shared/components/secondary-button/secondary-button.component';
import { StandardModalComponent } from '../../../shared/components/standard-modal/standard-modal.component';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    InputNumberModule,
    InputTextModule,
    TableModule,
    TagModule,
    TooltipModule,
    DecimalPipe,
    PageHeaderComponent,
    PrimaryButtonComponent,
    SecondaryButtonComponent,
    StandardModalComponent,
    ConfirmationModalComponent,
  ],
  templateUrl: './recipe-detail.component.html',
})
export class RecipeDetailComponent implements OnInit {
  public themeService = inject(ThemeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private recipeService = inject(RecipeService);
  private productsService = inject(ProductsService);
  private messageService = inject(MessageService);

  productId: string = '';
  product = signal<Product | null>(null);
  ingredients = signal<IRecipeIngredient[]>([]);
  availableComponents = signal<Product[]>([]);

  loading = signal<boolean>(false);
  adding = signal<boolean>(false);
  editingIngredientId = signal<string | null>(null);

  // Delete Confirmation
  showDeleteConfirmModal = signal<boolean>(false);
  ingredientToDelete = signal<IRecipeIngredient | null>(null);
  deletingIngredient = signal<boolean>(false);

  // Unit conversion state
  showConverter = signal<boolean>(false);
  convValue = signal<number | null>(null);
  convUnit = signal<string | null>(null);

  availableConvUnits = [
    { label: 'Gramos (g)', value: 'g', type: 'mass' },
    { label: 'Kilogramos (kg)', value: 'kg', type: 'mass' },
    { label: 'Libras (lb)', value: 'lb', type: 'mass' },
    { label: 'Onzas (oz)', value: 'oz', type: 'mass' },
    { label: 'Mililitros (ml)', value: 'ml', type: 'volume' },
    { label: 'Litros (l)', value: 'l', type: 'volume' },
    { label: 'Onzas Líquidas (fl-oz)', value: 'fl-oz', type: 'volume' },
    { label: 'Tazas (cup)', value: 'cup', type: 'volume' },
  ];

  filteredComponents = computed(() => {
    const list = this.availableComponents();
    const currentIngs = this.ingredients();
    const editingId = this.editingIngredientId();

    if (list.length === 0) return [];

    const activeIng = currentIngs.find((i) => i.id === editingId);
    const editingComponentId =
      activeIng?.componentId || (activeIng as any)?.component_id || activeIng?.component?.id;

    const currentIds = new Set(
      currentIngs
        .map((ing) => {
          const id = ing.componentId || (ing as any).component_id || ing.component?.id;
          return id ? String(id) : null;
        })
        .filter((id) => id !== null && id !== (editingComponentId ? String(editingComponentId) : null))
    );

    return list.filter((comp) => !currentIds.has(String(comp.id)));
  });

  ingredientForm: FormGroup;

  constructor() {
    this.ingredientForm = this.fb.group({
      componentId: [null, Validators.required],
      quantity: [0, [Validators.required, Validators.min(0.0001)]],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id') || '';
    if (this.productId) {
      this.loadInitialData();
    } else {
      this.router.navigate(['/production/recipes']);
    }
  }

  loadInitialData(): void {
    this.loading.set(true);

    this.productsService.getProduct(this.productId).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.product.set(res.data);
        }
      },
    });

    this.loadIngredients();

    this.productsService
      .getProducts(undefined, false, undefined, undefined, false, 'raw_material')
      .subscribe({
        next: (res) => {
          if (res.statusCode === 200) {
            this.availableComponents.set(
              res.data.filter((p) => p.id !== this.productId && p.type !== 'raw_material')
            );
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  loadIngredients(): void {
    this.recipeService.getRecipeByProduct(this.productId).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.ingredients.set(res.data);
        }
      },
    });
  }

  onAddIngredient(): void {
    if (this.ingredientForm.invalid) {
      this.ingredientForm.markAllAsTouched();
      return;
    }

    this.adding.set(true);
    const editId = this.editingIngredientId();

    const payload = {
      productId: this.productId,
      ...this.ingredientForm.getRawValue(),
    };

    if (editId) {
      const updatePayload = {
        quantity: this.ingredientForm.get('quantity')?.value,
        notes: this.ingredientForm.get('notes')?.value,
      };

      this.recipeService.updateIngredient(editId, updatePayload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Actualizado',
            detail: 'Ingrediente actualizado correctamente',
          });
          this.loadIngredients();
          this.onCancelEdit();
          this.adding.set(false);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Error al actualizar ingrediente',
          });
          this.adding.set(false);
        },
      });
    } else {
      this.recipeService.addIngredient(payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Añadido',
            detail: 'Ingrediente agregado a la receta',
          });
          this.ingredientForm.reset({ quantity: 0, notes: '' });
          this.loadIngredients();
          this.adding.set(false);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Error al agregar ingrediente',
          });
          this.adding.set(false);
        },
      });
    }
  }

  onEditIngredient(ingredient: IRecipeIngredient): void {
    const componentId =
      ingredient.componentId || (ingredient as any).component_id || ingredient.component?.id;

    this.editingIngredientId.set(ingredient.id);
    this.ingredientForm.patchValue({
      componentId: componentId,
      quantity: ingredient.quantity,
      notes: ingredient.notes || '',
    });

    this.ingredientForm.get('componentId')?.disable();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onCancelEdit(): void {
    this.editingIngredientId.set(null);
    this.ingredientForm.enable();
    this.ingredientForm.reset({ quantity: 0, notes: '' });
  }

  onDeleteIngredient(ingredient: IRecipeIngredient): void {
    this.ingredientToDelete.set(ingredient);
    this.showDeleteConfirmModal.set(true);
  }

  confirmDelete(): void {
    const ing = this.ingredientToDelete();
    if (!ing) return;

    this.deletingIngredient.set(true);
    this.recipeService.removeIngredient(ing.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Ingrediente removido satisfactoriamente',
        });
        this.showDeleteConfirmModal.set(false);
        this.ingredientToDelete.set(null);
        this.deletingIngredient.set(false);
        this.loadIngredients();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Error al eliminar ingrediente',
        });
        this.deletingIngredient.set(false);
      },
    });
  }

  onBack(): void {
    this.router.navigate(['/production/recipes']);
  }

  getProductImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }

  getSelectedComponentUnit(): string {
    const componentId = this.ingredientForm.get('componentId')?.value;
    const component = this.availableComponents().find((p) => p.id === componentId);
    return component?.unit?.abbreviation || '';
  }

  getSelectedComponentAllowsDecimals(): boolean {
    const componentId = this.ingredientForm.get('componentId')?.value;
    const component = this.availableComponents().find((p) => p.id === componentId);
    return component?.unit?.allowsDecimals ?? true;
  }

  // --- UNIT CONVERSION HELPERS ---
  openConverter(): void {
    const componentId = this.ingredientForm.get('componentId')?.value;
    if (!componentId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Por favor, seleccione un insumo primero',
      });
      return;
    }

    this.convValue.set(null);
    this.convUnit.set(null);
    this.showConverter.set(true);
  }

  getCompatibleConvUnits() {
    const baseUnit = this.getSelectedComponentUnit().toLowerCase();

    const massUnits = ['lb', 'kg', 'g', 'oz'];
    const volUnits = ['l', 'ml', 'fl-oz', 'cup', 'oz'];

    if (massUnits.includes(baseUnit)) {
      return this.availableConvUnits.filter((u) => u.type === 'mass');
    }
    if (volUnits.includes(baseUnit)) {
      return this.availableConvUnits.filter((u) => u.type === 'volume');
    }

    return this.availableConvUnits;
  }

  applyConversion(): void {
    const value = this.convValue();
    const fromUnit = this.convUnit();
    const targetBase = this.getSelectedComponentUnit().toLowerCase();

    if (value === null || !fromUnit) return;

    try {
      const targetUnit = this.normalizeUnit(targetBase);
      const result = this.executeConversion(value, fromUnit, targetUnit);

      this.ingredientForm.patchValue({
        quantity: parseFloat(result.toFixed(4)),
      });

      this.showConverter.set(false);
      this.messageService.add({
        severity: 'info',
        summary: 'Convertido',
        detail: `${value} ${fromUnit} convertido a ${result.toFixed(4)} ${targetBase}`,
      });
    } catch (e) {
      console.error('Error in conversion:', e);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo realizar la conversión entre estas unidades',
      });
    }
  }

  private executeConversion(value: number, from: string, to: string): number {
    if (from === to) return value;

    const toBase: { [key: string]: number } = {
      g: 1,
      kg: 1000,
      lb: 453.592,
      oz: 28.3495,
      ml: 1,
      l: 1000,
      'fl-oz': 29.5735,
      cup: 236.588,
    };

    if (!toBase[from] || !toBase[to]) {
      throw new Error(`Unidad no soportada: ${from} o ${to}`);
    }

    const valueInBase = value * toBase[from];
    return valueInBase / toBase[to];
  }

  private normalizeUnit(unit: string): string {
    const u = unit.toLowerCase().trim();
    if (u === 'lb' || u === 'libra' || u === 'libras') return 'lb';
    if (u === 'g' || u === 'gramo' || u === 'gramos') return 'g';
    if (u === 'kg' || u === 'kilogramo' || u === 'kilo' || u === 'kilos') return 'kg';
    if (u === 'oz' || u === 'onza' || u === 'onzas') return 'oz';
    if (u === 'l' || u === 'litro' || u === 'litros') return 'l';
    if (u === 'ml' || u === 'mililitro' || u === 'mililitros') return 'ml';
    if (u === 'fl-oz' || u === 'onz liq' || u === 'onza liquida') return 'fl-oz';
    if (u === 'cup' || u === 'taza' || u === 'tazas') return 'cup';
    return u;
  }
}
