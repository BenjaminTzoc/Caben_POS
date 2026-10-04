import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ConfirmService } from '../../shared/services/confirm.service';
import { UnitsService } from '../services/units.service';
import { UnitMeasure } from '../interfaces/unit.interface';
import { AuthService } from '../../auth/auth.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { RefreshButtonComponent } from '../../shared/components/refresh-button/refresh-button.component';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { StandardTableComponent } from '../../shared/components/standard-table/standard-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { UnitModalComponent } from './unit-modal/unit-modal.component';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-units',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    FormsModule,
    ToggleSwitchModule,
    TooltipModule,
    PageHeaderComponent,
    PrimaryButtonComponent,
    RefreshButtonComponent,
    SearchInputComponent,
    StandardTableComponent,
    StatusBadgeComponent,
    UnitModalComponent,
  ],
  templateUrl: './units.component.html',
  styleUrl: './units.component.css',
})
export class UnitsComponent implements OnInit {
  public themeService = inject(ThemeService);
  private unitsService = inject(UnitsService);
  private confirmService = inject(ConfirmService);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);

  units: UnitMeasure[] = [];
  loading = signal<boolean>(false);
  searchTerm: string = '';
  showDeleted: boolean = false;

  // Modal State
  modalVisible = false;
  selectedUnit: UnitMeasure | null = null;

  get filteredUnits(): UnitMeasure[] {
    if (!this.searchTerm.trim()) {
      return this.units;
    }
    const term = this.searchTerm.toLowerCase().trim();
    return this.units.filter(
      (u) =>
        u.name?.toLowerCase().includes(term) ||
        u.abbreviation?.toLowerCase().includes(term) ||
        u.description?.toLowerCase().includes(term)
    );
  }

  get canViewDeleted(): boolean {
    const user = this.authService.currentUser;
    if (!user) return false;
    return user.roles?.some((r) => r.isSuperAdmin || r.name === 'Admin') ?? false;
  }

  ngOnInit(): void {
    this.loadUnits();
  }

  loadUnits(): void {
    this.loading.set(true);
    this.unitsService.getUnits(this.showDeleted).subscribe({
      next: (response) => {
        this.units = response.data || [];
        this.loading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las unidades de medida',
        });
        this.loading.set(false);
      },
    });
  }

  openCreateModal(): void {
    this.selectedUnit = null;
    this.modalVisible = true;
  }

  openEditModal(unit: UnitMeasure): void {
    this.selectedUnit = unit;
    this.modalVisible = true;
  }

  onUnitSaved(): void {
    this.loadUnits();
  }

  isDeleted(unit: UnitMeasure): boolean {
    return unit.deletedAt != null;
  }

  deleteUnit(id: string): void {
    this.confirmService.confirm({
      message: '¿Estás seguro de que deseas eliminar esta unidad de medida?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      type: 'danger',
      accept: () => {
        this.unitsService.deleteUnit(id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Unidad de medida eliminada',
            });
            this.loadUnits();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la unidad de medida',
            });
          },
        });
      },
    });
  }

  restoreUnit(id: string): void {
    this.confirmService.confirm({
      message: '¿Estás seguro de que deseas restaurar esta unidad de medida?',
      header: 'Confirmar restauración',
      icon: 'pi pi-refresh',
      confirmLabel: 'Restaurar',
      cancelLabel: 'Cancelar',
      type: 'success',
      accept: () => {
        this.unitsService.restoreUnit(id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Unidad de medida restaurada',
            });
            this.loadUnits();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo restaurar la unidad de medida',
            });
          },
        });
      },
    });
  }
}
