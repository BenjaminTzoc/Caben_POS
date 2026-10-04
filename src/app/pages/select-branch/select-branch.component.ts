import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { BranchesService } from '../../inventory/services/branches.service';
import { BranchContextService } from '../../core/services/branch-context.service';
import { Branch } from '../../inventory/interfaces/branch.interface';
import { DangerButtonComponent } from '../../shared/components/danger-button/danger-button.component';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-select-branch',
  standalone: true,
  imports: [CommonModule, DangerButtonComponent],
  templateUrl: './select-branch.component.html',
})
export class SelectBranchComponent implements OnInit {
  private authService = inject(AuthService);
  private branchesService = inject(BranchesService);
  private branchContext = inject(BranchContextService);
  public themeService = inject(ThemeService);
  private router = inject(Router);

  branches = signal<Branch[]>([]);

  get currentUser() {
    return this.authService.currentUser;
  }

  get isSuperAdmin() {
    return this.authService.isSuperAdmin;
  }

  ngOnInit(): void {
    const user = this.currentUser;

    // Si el usuario no es superadmin y ya tiene sucursal fija asignada, entrar directamente
    if (user && !this.isSuperAdmin && user.branch?.id) {
      this.branchContext.setWorkingBranch({
        id: user.branch.id,
        name: user.branch.name,
        isPlant: user.branch.isPlant,
        isCentral: user.branch.isCentral,
      });
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadBranches();
  }

  loadBranches(): void {
    this.branchesService.getBranches().subscribe({
      next: (res) => {
        if (res.data) {
          const sorted = [...res.data].sort((a, b) => (b.isPlant ? 1 : 0) - (a.isPlant ? 1 : 0));
          this.branches.set(sorted);
          if (sorted.length === 1 && !this.isSuperAdmin) {
            this.selectBranch(sorted[0]);
          }
        }
      },
      error: (err) => console.error('Error cargando sucursales', err),
    });
  }

  selectBranch(branch: Branch): void {
    this.branchContext.setWorkingBranch({
      id: branch.id,
      name: branch.name,
      isPlant: branch.isPlant,
      address: branch.address,
      phone: branch.phone,
    });
    this.router.navigate(['/dashboard']);
  }

  selectGlobal(): void {
    this.branchContext.setGlobalMode();
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.branchContext.clear();
    this.authService.logout();
  }
}