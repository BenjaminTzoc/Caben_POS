import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { AreasService } from '../../services/areas.service';
import { Area } from '../../interfaces/area.interface';
import { BranchesService } from '../../../inventory/services/branches.service';
import { Branch } from '../../../inventory/interfaces/branch.interface';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../../auth/auth.service';
import { Router, RouterModule } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { ThemeService } from '../../../core/services/theme.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { RefreshButtonComponent } from '../../../shared/components/refresh-button/refresh-button.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { StandardTableComponent } from '../../../shared/components/standard-table/standard-table.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-areas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ToggleSwitchModule,
    TooltipModule,
    RouterModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    PageHeaderComponent,
    PrimaryButtonComponent,
    RefreshButtonComponent,
    SearchInputComponent,
    StandardTableComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './areas.component.html',
  styleUrl: './areas.component.css'
})
export class AreasComponent implements OnInit {
  public themeService = inject(ThemeService);
  private areasService = inject(AreasService);
  private branchesService = inject(BranchesService);
  private messageService = inject(MessageService);
  private confirmService = inject(ConfirmService);
  private authService = inject(AuthService);
  private router = inject(Router);

  areas = signal<Area[]>([]);
  loading = signal<boolean>(false);
  showDeleted = signal<boolean>(false);
  searchTerm = signal<string>('');

  filteredAreas = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.areas();
    if (!term) return list;
    return list.filter(
      (a) =>
        a.name?.toLowerCase().includes(term) ||
        a.description?.toLowerCase().includes(term) ||
        a.previousArea?.name?.toLowerCase().includes(term)
    );
  });

  activeAreas = computed(() => this.areas().filter(a => !a.deletedAt));
  
  get canViewDeleted(): boolean {
    const user = this.authService.currentUser;
    if (!user) return false;
    return user.roles?.some((r) => r.isSuperAdmin || r.name === 'Admin') ?? false;
  }

  ngOnInit(): void {
    this.loadAreas();
  }

  loadAreas(): void {
    this.loading.set(true);
    this.areasService.getAreas(this.showDeleted()).subscribe({
      next: (res) => {
        this.areas.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  isDeleted(area: Area): boolean {
    return area.deletedAt != null;
  }

  openNew(): void {
    this.router.navigate(['/logistics/new-area']);
  }

  editArea(area: Area): void {
    this.router.navigate(['/logistics/edit-area', area.id]);
  }

  deleteArea(area: Area): void {
    this.confirmService.confirm({
      message: `¿Estás seguro de eliminar el área: ${area.name}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      type: 'danger',
      accept: () => {
        this.areasService.deleteArea(area.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Área eliminada correctamente',
            });
            this.loadAreas();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el área',
            });
          },
        });
      },
    });
  }

  restoreArea(area: Area): void {
    this.confirmService.confirm({
      message: `¿Estás seguro de que deseas restaurar el área: ${area.name}?`,
      header: 'Confirmar restauración',
      icon: 'pi pi-refresh',
      confirmLabel: 'Restaurar',
      cancelLabel: 'Cancelar',
      type: 'success',
      accept: () => {
        this.areasService.restoreArea(area.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Área restaurada correctamente',
            });
            this.loadAreas();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo restaurar el área',
            });
          },
        });
      },
    });
  }
}
