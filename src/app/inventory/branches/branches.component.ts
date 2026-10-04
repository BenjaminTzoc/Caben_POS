import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ConfirmService } from '../../shared/services/confirm.service';
import { BranchesService } from '../services/branches.service';
import { Branch } from '../interfaces/branch.interface';
import { AuthService } from '../../auth/auth.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { RefreshButtonComponent } from '../../shared/components/refresh-button/refresh-button.component';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { StandardTableComponent } from '../../shared/components/standard-table/standard-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { BranchModalComponent } from './branch-modal/branch-modal.component';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    ToggleSwitchModule,
    TooltipModule,
    TagModule,
    PageHeaderComponent,
    PrimaryButtonComponent,
    RefreshButtonComponent,
    SearchInputComponent,
    StandardTableComponent,
    StatusBadgeComponent,
    BranchModalComponent,
  ],
  templateUrl: './branches.component.html',
  styleUrl: './branches.component.css',
})
export class BranchesComponent implements OnInit {
  public themeService = inject(ThemeService);
  private router = inject(Router);
  private branchesService = inject(BranchesService);
  private messageService = inject(MessageService);
  private confirmService = inject(ConfirmService);
  private authService = inject(AuthService);

  branches: Branch[] = [];
  loading = signal<boolean>(false);
  showDeleted: boolean = false;
  searchTerm: string = '';

  // Modal State
  modalVisible = false;
  selectedBranch: Branch | null = null;

  get filteredBranches(): Branch[] {
    if (!this.searchTerm.trim()) {
      return this.branches;
    }
    const term = this.searchTerm.toLowerCase().trim();
    return this.branches.filter(
      (b) =>
        b.name?.toLowerCase().includes(term) ||
        b.address?.toLowerCase().includes(term) ||
        b.phone?.toLowerCase().includes(term) ||
        b.email?.toLowerCase().includes(term)
    );
  }

  get canViewDeleted(): boolean {
    const user = this.authService.currentUser;
    if (!user) return false;
    return user.roles?.some((r) => r.isSuperAdmin || r.name === 'Admin') ?? false;
  }

  ngOnInit(): void {
    this.loadBranches();
  }

  loadBranches(): void {
    this.loading.set(true);
    this.branchesService.getBranches(this.showDeleted).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.branches = res.data;
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las sucursales',
        });
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  openCreateModal(): void {
    this.selectedBranch = null;
    this.modalVisible = true;
  }

  openEditModal(branch: Branch): void {
    this.selectedBranch = branch;
    this.modalVisible = true;
  }

  onBranchSaved(): void {
    this.loadBranches();
  }

  isDeleted(branch: Branch): boolean {
    return branch.deletedAt != null;
  }

  onDeleteBranch(branch: Branch): void {
    this.confirmService.confirm({
      message: `¿Estás seguro de eliminar la sucursal: ${branch.name}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      type: 'danger',
      accept: () => {
        this.branchesService.deleteBranch(branch.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Sucursal eliminada correctamente',
            });
            this.loadBranches();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la sucursal',
            });
          },
        });
      },
    });
  }

  onRestoreBranch(branch: Branch): void {
    this.confirmService.confirm({
      message: `¿Estás seguro de restaurar la sucursal: ${branch.name}?`,
      header: 'Confirmar restauración',
      icon: 'pi pi-refresh',
      confirmLabel: 'Restaurar',
      cancelLabel: 'Cancelar',
      type: 'success',
      accept: () => {
        this.branchesService.restoreBranch(branch.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Sucursal restaurada correctamente',
            });
            this.loadBranches();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo restaurar la sucursal',
            });
          },
        });
      },
    });
  }
}
