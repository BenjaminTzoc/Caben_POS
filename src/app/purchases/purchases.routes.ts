import { Routes } from '@angular/router';
import { permissionGuard } from '../auth/permission.guard';
import { globalOnlyGuard } from '../auth/global-only.guard';

export const PURCHASES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissionGuard],
    data: { permission: 'purchases.view' },
    loadComponent: () => import('./purchases.component').then((m) => m.PurchasesComponent),
  },
  {
    path: 'suppliers',
    canActivate: [permissionGuard, globalOnlyGuard],
    data: { permission: 'suppliers.manage' },
    loadComponent: () =>
      import('./suppliers/suppliers.component').then((m) => m.SuppliersComponent),
  },
  {
    path: 'new-supplier',
    canActivate: [permissionGuard, globalOnlyGuard],
    data: { permission: 'suppliers.manage' },
    loadComponent: () =>
      import('./suppliers/supplier-form/supplier-form.component').then((m) => m.SupplierFormComponent),
  },
  {
    path: 'edit-supplier/:id',
    canActivate: [permissionGuard, globalOnlyGuard],
    data: { permission: 'suppliers.manage' },
    loadComponent: () =>
      import('./suppliers/supplier-form/supplier-form.component').then((m) => m.SupplierFormComponent),
  },
  {
    path: 'orders',
    canActivate: [permissionGuard],
    data: { permission: 'purchases.view' },
    loadComponent: () =>
      import('./purchase-orders/purchase-orders.component').then((m) => m.PurchaseOrdersComponent),
  },
  {
    path: 'new-order',
    canActivate: [permissionGuard],
    data: { permission: 'purchases.manage' },
    loadComponent: () =>
      import('./purchase-orders/purchase-order-form/purchase-order-form.component').then(
        (m) => m.PurchaseOrderFormComponent,
      ),
  },
];