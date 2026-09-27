import { Routes } from '@angular/router';

export const INVENTORY_ROUTES: Routes = [
  {
    path: 'products',
    loadComponent: () =>
      import('./products/products.component').then((m) => m.ProductsComponent),
  },
  {
    path: 'new-product',
    loadComponent: () =>
      import('./products/product-form/product-form.component').then((m) => m.ProductFormComponent),
  },
  {
    path: 'edit-product/:id',
    loadComponent: () =>
      import('./products/product-form/product-form.component').then((m) => m.ProductFormComponent),
  },
  {
    path: 'inventories',
    loadComponent: () =>
      import('./inventories/inventories.component').then((m) => m.InventoriesComponent),
  },
  {
    path: 'new-inventory',
    loadComponent: () =>
      import('./inventories/inventory-form/inventory-form.component').then(
        (m) => m.InventoryFormComponent,
      ),
  },
  {
    path: 'product-categories',
    loadComponent: () =>
      import('./product-categories/product-categories.component').then(
        (m) => m.ProductCategoriesComponent,
      ),
  },
  {
    path: 'new-category',
    loadComponent: () =>
      import('./product-categories/category-form/category-form.component').then(
        (m) => m.CategoryFormComponent,
      ),
  },
  {
    path: 'edit-category/:id',
    loadComponent: () =>
      import('./product-categories/category-form/category-form.component').then(
        (m) => m.CategoryFormComponent,
      ),
  },
  {
    path: 'inventory-movements',
    loadComponent: () =>
      import('./inventory-movements/inventory-movements.component').then(
        (m) => m.InventoryMovementsComponent,
      ),
  },
  {
    path: 'new-movement',
    loadComponent: () =>
      import('./inventory-movements/movement-form/movement-form.component').then(
        (m) => m.MovementFormComponent,
      ),
  },
  {
    path: 'units',
    loadComponent: () => import('./units/units.component').then((m) => m.UnitsComponent),
  },
  {
    path: 'new-unit',
    loadComponent: () =>
      import('./units/unit-form/unit-form.component').then((m) => m.UnitFormComponent),
  },
  {
    path: 'edit-unit/:id',
    loadComponent: () =>
      import('./units/unit-form/unit-form.component').then((m) => m.UnitFormComponent),
  },
  {
    path: 'branches',
    loadComponent: () => import('./branches/branches.component').then((m) => m.BranchesComponent),
  },
  {
    path: 'new-branch',
    loadComponent: () =>
      import('./branches/branch-form/branch-form.component').then((m) => m.BranchFormComponent),
  },
  {
    path: 'edit-branch/:id',
    loadComponent: () =>
      import('./branches/branch-form/branch-form.component').then((m) => m.BranchFormComponent),
  },
  {
    path: 'inventory-transfers',
    loadComponent: () =>
      import('./inventory-transfers/inventory-transfers.component').then(
        (m) => m.InventoryTransfersComponent,
      ),
  },
  {
    path: 'new-transfer',
    loadComponent: () =>
      import('./inventory-transfers/transfer-form/transfer-form.component').then(
        (m) => m.TransferFormComponent,
      ),
  },
  {
    path: 'edit-transfer/:id',
    loadComponent: () =>
      import('./inventory-transfers/transfer-form/transfer-form.component').then(
        (m) => m.TransferFormComponent,
      ),
  },
];
