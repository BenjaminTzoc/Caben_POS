import { Routes } from '@angular/router';

export const PURCHASES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./purchases.component').then((m) => m.PurchasesComponent),
  },
  {
    path: 'suppliers',
    loadComponent: () =>
      import('./suppliers/suppliers.component').then((m) => m.SuppliersComponent),
  },
  {
    path: 'new-supplier',
    loadComponent: () =>
      import('./suppliers/supplier-form/supplier-form.component').then((m) => m.SupplierFormComponent),
  },
  {
    path: 'edit-supplier/:id',
    loadComponent: () =>
      import('./suppliers/supplier-form/supplier-form.component').then((m) => m.SupplierFormComponent),
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./purchase-orders/purchase-orders.component').then((m) => m.PurchaseOrdersComponent),
  },
  {
    path: 'new-order',
    loadComponent: () =>
      import('./purchase-orders/purchase-order-form/purchase-order-form.component').then(
        (m) => m.PurchaseOrderFormComponent,
      ),
  },
];
