import { Routes } from '@angular/router';
import { permissionGuard } from '../auth/permission.guard';
import { globalOnlyGuard } from '../auth/global-only.guard';

export const INVENTORY_ROUTES: Routes = [
  {
    path: 'products',
    canActivate: [permissionGuard],
    data: { permission: 'products.view' },
    loadComponent: () =>
      import('./products/products.component').then((m) => m.ProductsComponent),
  },
  {
    path: 'new-product',
    canActivate: [permissionGuard],
    data: { permission: 'products.manage' },
    loadComponent: () =>
      import('./products/product-form/product-form.component').then((m) => m.ProductFormComponent),
  },
  {
    path: 'edit-product/:id',
    canActivate: [permissionGuard],
    data: { permission: 'products.manage' },
    loadComponent: () =>
      import('./products/product-form/product-form.component').then((m) => m.ProductFormComponent),
  },
  {
    path: 'inventories',
    canActivate: [permissionGuard],
    data: { permission: 'inventory.view' },
    loadComponent: () =>
      import('./inventories/inventories.component').then((m) => m.InventoriesComponent),
  },
  {
    path: 'new-inventory',
    canActivate: [permissionGuard],
    data: { permission: 'inventory.movements' },
    loadComponent: () =>
      import('./inventories/inventory-form/inventory-form.component').then(
        (m) => m.InventoryFormComponent,
      ),
  },
  {
    path: 'product-categories',
    canActivate: [permissionGuard, globalOnlyGuard],
    data: { permission: 'product-categories.manage' },
    loadComponent: () =>
      import('./product-categories/product-categories.component').then(
        (m) => m.ProductCategoriesComponent,
      ),
  },
  {
    path: 'new-category',
    canActivate: [permissionGuard, globalOnlyGuard],
    data: { permission: 'product-categories.manage' },
    loadComponent: () =>
      import('./product-categories/category-form/category-form.component').then(
        (m) => m.CategoryFormComponent,
      ),
  },
  {
    path: 'edit-category/:id',
    canActivate: [permissionGuard, globalOnlyGuard],
    data: { permission: 'product-categories.manage' },
    loadComponent: () =>
      import('./product-categories/category-form/category-form.component').then(
        (m) => m.CategoryFormComponent,
      ),
  },
  {
    path: 'inventory-movements',
    canActivate: [permissionGuard],
    data: { permission: 'inventory.movements' },
    loadComponent: () =>
      import('./inventory-movements/inventory-movements.component').then(
        (m) => m.InventoryMovementsComponent,
      ),
  },
  {
    path: 'new-movement',
    canActivate: [permissionGuard],
    data: { permission: 'inventory.movements' },
    loadComponent: () =>
      import('./inventory-movements/movement-form/movement-form.component').then(
        (m) => m.MovementFormComponent,
      ),
  },
  {
    path: 'units',
    canActivate: [permissionGuard, globalOnlyGuard],
    data: { permission: 'units.manage' },
    loadComponent: () => import('./units/units.component').then((m) => m.UnitsComponent),
  },
  {
    path: 'new-unit',
    canActivate: [permissionGuard, globalOnlyGuard],
    data: { permission: 'units.manage' },
    loadComponent: () =>
      import('./units/unit-form/unit-form.component').then((m) => m.UnitFormComponent),
  },
  {
    path: 'edit-unit/:id',
    canActivate: [permissionGuard, globalOnlyGuard],
    data: { permission: 'units.manage' },
    loadComponent: () =>
      import('./units/unit-form/unit-form.component').then((m) => m.UnitFormComponent),
  },
  {
    path: 'branches',
    canActivate: [permissionGuard, globalOnlyGuard],
    data: { permission: 'branches.manage' },
    loadComponent: () => import('./branches/branches.component').then((m) => m.BranchesComponent),
  },
  {
    path: 'new-branch',
    canActivate: [permissionGuard, globalOnlyGuard],
    data: { permission: 'branches.manage' },
    loadComponent: () =>
      import('./branches/branch-form/branch-form.component').then((m) => m.BranchFormComponent),
  },
  {
    path: 'edit-branch/:id',
    canActivate: [permissionGuard, globalOnlyGuard],
    data: { permission: 'branches.manage' },
    loadComponent: () =>
      import('./branches/branch-form/branch-form.component').then((m) => m.BranchFormComponent),
  },
  {
    path: 'inventory-transfers',
    canActivate: [permissionGuard],
    data: { permission: 'inventory.transfers' },
    loadComponent: () =>
      import('./inventory-transfers/inventory-transfers.component').then(
        (m) => m.InventoryTransfersComponent,
      ),
  },
  {
    path: 'new-transfer',
    canActivate: [permissionGuard],
    data: { permission: 'inventory.transfers' },
    loadComponent: () =>
      import('./inventory-transfers/transfer-form/transfer-form.component').then(
        (m) => m.TransferFormComponent,
      ),
  },
  {
    path: 'edit-transfer/:id',
    canActivate: [permissionGuard],
    data: { permission: 'inventory.transfers' },
    loadComponent: () =>
      import('./inventory-transfers/transfer-form/transfer-form.component').then(
        (m) => m.TransferFormComponent,
      ),
  },
];