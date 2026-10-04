import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Category } from '../interfaces/product.interface';
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TagModule } from 'primeng/tag';
import { ProductsService } from '../services/products.service';
import { MessageService } from 'primeng/api';
import { ConfirmService } from '../../shared/services/confirm.service';
import { AuthService } from '../../auth/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { RefreshButtonComponent } from '../../shared/components/refresh-button/refresh-button.component';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { StandardTableComponent } from '../../shared/components/standard-table/standard-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-product-categories',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    TableModule,
    DatePipe,
    ToggleSwitchModule,
    TagModule,
    PageHeaderComponent,
    PrimaryButtonComponent,
    RefreshButtonComponent,
    SearchInputComponent,
    StandardTableComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './product-categories.component.html',
  styleUrl: './product-categories.component.css',
})
export class ProductCategoriesComponent implements OnInit {
  public themeService = inject(ThemeService);
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private messageService = inject(MessageService);
  private confirmService = inject(ConfirmService);
  private authService = inject(AuthService);

  categories = signal<Category[]>([]);
  loading = signal<boolean>(false);
  showDeleted = false;
  searchTerm = signal<string>('');

  filteredCategories = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.categories();
    return this.categories().filter(c => 
      c.name?.toLowerCase().includes(term) ||
      c.description?.toLowerCase().includes(term) ||
      c.defaultUnit?.name?.toLowerCase().includes(term) ||
      c.defaultUnit?.abbreviation?.toLowerCase().includes(term)
    );
  });

  get canViewDeleted(): boolean {
    const user = this.authService.currentUser;
    if (!user) return false;
    return user.roles?.some((r) => r.isSuperAdmin || r.name === 'Admin') ?? false;
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);

    this.productsService.getCategories(this.showDeleted).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.categories.set(res.data);
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error cargando las categorías: ${err.error.message}`,
        });
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  goToNewCategory() {
    this.router.navigate(['inventory/new-category']);
  }

  onEditCategory(categoryId: string): void {
    this.router.navigate(['inventory/edit-category', categoryId]);
  }

  onDeleteCategory(category: Category) {
    this.confirmService.confirm({
      message: `¿Está seguro de eliminar la categoría: ${category.name}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-info-circle',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      type: 'danger',
      accept: () => {
        this.productsService.deleteCategory(category.id).subscribe({
          next: (response) => {
            if (response.statusCode === 200) {
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: `La categoría se ha eliminado correctamente.`,
              });
              this.loadCategories();
            }
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error eliminando la categoría: ${error.error.message}`,
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

  isDeleted(category: Category): boolean {
    return category.deletedAt != null;
  }

  restoreCategory(category: Category): void {
    this.confirmService.confirm({
      message: `¿Está seguro de restaurar la categoría: ${category.name}?`,
      header: 'Confirmar restauración',
      icon: 'pi pi-refresh',
      confirmLabel: 'Restaurar',
      cancelLabel: 'Cancelar',
      type: 'success',
      accept: () => {
        this.productsService.restoreCategory(category.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Categoría restaurada correctamente',
            });
            this.loadCategories();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo restaurar la categoría',
            });
          },
        });
      },
    });
  }
}
