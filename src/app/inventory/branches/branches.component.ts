import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ConfirmService } from '../../shared/services/confirm.service';
import { BranchesService } from '../services/branches.service';
import { Branch } from '../interfaces/branch.interface';
import { AuthService } from '../../auth/auth.service';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

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
    InputTextModule,
    TagModule,
    IconFieldModule,
    InputIconModule
  ],
  templateUrl: './branches.component.html',
  styleUrl: './branches.component.css',
})
export class BranchesComponent implements OnInit {
  private router = inject(Router);
  private branchesService = inject(BranchesService);
  private messageService = inject(MessageService);
  private confirmService = inject(ConfirmService);
  private authService = inject(AuthService);

  branches: Branch[] = [];
  loading = signal<boolean>(false);
  showDeleted: boolean = false;

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

  goToNewBranch(): void {
    this.router.navigate(['inventory/new-branch']);
  }

  onEditBranch(id: string): void {
    this.router.navigate(['inventory/edit-branch', id]);
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
