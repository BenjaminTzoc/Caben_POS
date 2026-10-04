import { inject, Injectable, signal } from '@angular/core';
import { Branch } from '../../inventory/interfaces/branch.interface';
import { AuthService } from '../../auth/auth.service';
import { BranchesService } from '../../inventory/services/branches.service';

export interface WorkingBranch {
  id: string | null; // null = Modo Global (Todas las sucursales)
  name: string;
  isPlant?: boolean;
  isCentral?: boolean;
  address?: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BranchContextService {
  private authService = inject(AuthService);
  private branchesService = inject(BranchesService);

  private readonly STORAGE_KEY = 'activeWorkingBranch';

  // Signal reactivo para toda la aplicación
  public currentBranch = signal<WorkingBranch | null>(this.getStoredBranch());
  public availableBranches = signal<Branch[]>([]);
  public isSelectionRequired = signal<boolean>(false);

  constructor() {
    this.initContext();
  }

  public initContext(): void {
    const user = this.authService.currentUser;
    if (!user) return;

    if (!this.authService.isSuperAdmin && user.branch?.id) {
      // Usuario estándar: sucursal fija obligatoria
      const fixed: WorkingBranch = {
        id: user.branch.id,
        name: user.branch.name,
        isPlant: user.branch.isPlant,
        isCentral: user.branch.isCentral,
      };
      this.setWorkingBranch(fixed);
      this.isSelectionRequired.set(false);
    } else if (this.authService.isSuperAdmin) {
      // Superadmin: cargar lista de sucursales
      this.branchesService.getBranches({ minimal: true }).subscribe({
        next: (res) => {
          if (res.data) {
            this.availableBranches.set(res.data);
            const stored = this.getStoredBranch();
            if (!stored) {
              this.isSelectionRequired.set(true);
            }
          }
        },
      });
    }
  }

  public setWorkingBranch(branch: WorkingBranch): void {
    this.currentBranch.set(branch);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(branch));
    this.isSelectionRequired.set(false);
  }

  public setGlobalMode(): void {
    const globalBranch: WorkingBranch = {
      id: null,
      name: 'Todas las Sucursales (Global)',
      isCentral: true,
    };
    this.setWorkingBranch(globalBranch);
  }

  public clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentBranch.set(null);
  }

  private getStoredBranch(): WorkingBranch | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  get activeBranchId(): string | null {
    return this.currentBranch()?.id ?? null;
  }

  get isGlobalView(): boolean {
    return this.currentBranch()?.id === null;
  }
}