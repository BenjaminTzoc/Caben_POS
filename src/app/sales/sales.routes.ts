import { Routes } from '@angular/router';
import { permissionGuard } from '../auth/permission.guard';
import { globalOnlyGuard } from '../auth/global-only.guard';

export const SALES_ROUTES: Routes = [
  {
    path: 'customers',
    canActivate: [permissionGuard],
    data: { permission: 'customers.view' },
    loadComponent: () =>
      import('./customers/customers.component').then((m) => m.CustomersComponent),
  },
  {
    path: 'new-customer',
    canActivate: [permissionGuard],
    data: { permission: 'customers.create' },
    loadComponent: () =>
      import('./customers/customer-form/customer-form.component').then((m) => m.CustomerFormComponent),
  },
  {
    path: 'edit-customer/:id',
    canActivate: [permissionGuard],
    data: { permission: 'customers.manage' },
    loadComponent: () =>
      import('./customers/customer-form/customer-form.component').then((m) => m.CustomerFormComponent),
  },
  {
    path: 'customer-categories',
    canActivate: [permissionGuard, globalOnlyGuard],
    data: { permission: 'customer-categories.manage' },
    loadComponent: () =>
      import('./customer-categories/customer-categories.component').then(
        (m) => m.CustomerCategoriesComponent,
      ),
  },
  {
    path: 'customer-categories/new',
    canActivate: [permissionGuard, globalOnlyGuard],
    data: { permission: 'customer-categories.manage' },
    loadComponent: () =>
      import('./customer-categories/customer-category-form/customer-category-form.component').then(
        (m) => m.CustomerCategoryFormComponent,
      ),
  },
  {
    path: 'customer-categories/edit/:id',
    canActivate: [permissionGuard, globalOnlyGuard],
    data: { permission: 'customer-categories.manage' },
    loadComponent: () =>
      import('./customer-categories/customer-category-form/customer-category-form.component').then(
        (m) => m.CustomerCategoryFormComponent,
      ),
  },
  {
    path: 'orders',
    canActivate: [permissionGuard],
    data: { permission: 'orders.view' },
    loadComponent: () =>
      import('./sale-orders/sale-orders.component').then((m) => m.SaleOrdersComponent),
  },
  {
    path: 'new-order',
    canActivate: [permissionGuard],
    data: { permission: 'orders.create' },
    loadComponent: () =>
      import('./sale-orders/sale-order-form/sale-order-form.component').then(
        (m) => m.SaleOrderFormComponent,
      ),
  },
  {
    path: 'cash-register',
    canActivate: [permissionGuard],
    data: { permission: 'cash.view' },
    loadComponent: () =>
      import('./cash-register/cash-register.component').then((m) => m.CashRegisterComponent),
  },
  {
    path: 'cash-history',
    canActivate: [permissionGuard],
    data: { permission: 'cash.view' },
    loadComponent: () =>
      import('./cash-register/cash-history/cash-history.component').then(
        (m) => m.CashHistoryComponent,
      ),
  },
  {
    path: 'pos',
    canActivate: [permissionGuard],
    data: { permission: 'orders.create' },
    loadComponent: () =>
      import('./pos/pos-layout/pos-layout.component').then((m) => m.PosLayoutComponent),
  },
  {
    path: 'quotations',
    canActivate: [permissionGuard],
    data: { permission: 'quotations.view' },
    loadComponent: () =>
      import('./quotations/quotations.component').then((m) => m.QuotationsComponent),
  },
  {
    path: 'new-quotation',
    canActivate: [permissionGuard],
    data: { permission: 'quotations.create' },
    loadComponent: () =>
      import('./quotations/quotation-edit/quotation-edit.component').then(
        (m) => m.QuotationEditComponent,
      ),
  },
  {
    path: 'edit-quotation/:id',
    canActivate: [permissionGuard],
    data: { permission: 'quotations.view' },
    loadComponent: () =>
      import('./quotations/quotation-edit/quotation-edit.component').then(
        (m) => m.QuotationEditComponent,
      ),
  },
  {
    path: 'quick-sale',
    canActivate: [permissionGuard],
    data: { permission: 'orders.create' },
    loadComponent: () =>
      import('./quick-sales/quick-sales.component').then((m) => m.QuickSaleComponent),
  },
  {
    path: 'payment-methods',
    canActivate: [permissionGuard, globalOnlyGuard],
    data: { permission: 'payment-methods.manage' },
    loadComponent: () =>
      import('./payment-methods/payment-methods.component').then((m) => m.PaymentMethodsComponent),
  },
  {
    path: 'payment-methods/new',
    canActivate: [permissionGuard, globalOnlyGuard],
    data: { permission: 'payment-methods.manage' },
    loadComponent: () =>
      import('./payment-methods/payment-method-form/payment-method-form.component').then(
        (m) => m.PaymentMethodFormComponent,
      ),
  },
  {
    path: 'payment-methods/edit/:id',
    canActivate: [permissionGuard, globalOnlyGuard],
    data: { permission: 'payment-methods.manage' },
    loadComponent: () =>
      import('./payment-methods/payment-method-form/payment-method-form.component').then(
        (m) => m.PaymentMethodFormComponent,
      ),
  },
  {
    path: 'bank-accounts',
    canActivate: [permissionGuard, globalOnlyGuard],
    data: { permission: 'payment-methods.manage' },
    loadComponent: () =>
      import('./bank-accounts/bank-accounts.component').then((m) => m.BankAccountsComponent),
  },
];