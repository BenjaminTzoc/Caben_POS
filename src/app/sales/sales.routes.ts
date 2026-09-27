import { Routes } from '@angular/router';

export const SALES_ROUTES: Routes = [
  {
    path: 'customers',
    loadComponent: () =>
      import('./customers/customers.component').then((m) => m.CustomersComponent),
  },
  {
    path: 'new-customer',
    loadComponent: () =>
      import('./customers/customer-form/customer-form.component').then((m) => m.CustomerFormComponent),
  },
  {
    path: 'edit-customer/:id',
    loadComponent: () =>
      import('./customers/customer-form/customer-form.component').then((m) => m.CustomerFormComponent),
  },
  {
    path: 'customer-categories',
    loadComponent: () =>
      import('./customer-categories/customer-categories.component').then(
        (m) => m.CustomerCategoriesComponent,
      ),
  },
  {
    path: 'customer-categories/new',
    loadComponent: () =>
      import('./customer-categories/customer-category-form/customer-category-form.component').then(
        (m) => m.CustomerCategoryFormComponent,
      ),
  },
  {
    path: 'customer-categories/edit/:id',
    loadComponent: () =>
      import('./customer-categories/customer-category-form/customer-category-form.component').then(
        (m) => m.CustomerCategoryFormComponent,
      ),
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./sale-orders/sale-orders.component').then((m) => m.SaleOrdersComponent),
  },
  {
    path: 'new-order',
    loadComponent: () =>
      import('./sale-orders/sale-order-form/sale-order-form.component').then(
        (m) => m.SaleOrderFormComponent,
      ),
  },
  {
    path: 'cash-register',
    loadComponent: () =>
      import('./cash-register/cash-register.component').then((m) => m.CashRegisterComponent),
  },
  {
    path: 'cash-history',
    loadComponent: () =>
      import('./cash-register/cash-history/cash-history.component').then(
        (m) => m.CashHistoryComponent,
      ),
  },
  {
    path: 'pos',
    loadComponent: () =>
      import('./pos/pos-layout/pos-layout.component').then((m) => m.PosLayoutComponent),
  },
  {
    path: 'quotations',
    loadComponent: () =>
      import('./quotations/quotations.component').then((m) => m.QuotationsComponent),
  },
  {
    path: 'new-quotation',
    loadComponent: () =>
      import('./quotations/quotation-edit/quotation-edit.component').then(
        (m) => m.QuotationEditComponent,
      ),
  },
  {
    path: 'edit-quotation/:id',
    loadComponent: () =>
      import('./quotations/quotation-edit/quotation-edit.component').then(
        (m) => m.QuotationEditComponent,
      ),
  },
  {
    path: 'quick-sale',
    loadComponent: () =>
      import('./quick-sales/quick-sales.component').then((m) => m.QuickSaleComponent),
  },
  {
    path: 'payment-methods',
    loadComponent: () =>
      import('./payment-methods/payment-methods.component').then((m) => m.PaymentMethodsComponent),
  },
  {
    path: 'payment-methods/new',
    loadComponent: () =>
      import('./payment-methods/payment-method-form/payment-method-form.component').then(
        (m) => m.PaymentMethodFormComponent,
      ),
  },
  {
    path: 'payment-methods/edit/:id',
    loadComponent: () =>
      import('./payment-methods/payment-method-form/payment-method-form.component').then(
        (m) => m.PaymentMethodFormComponent,
      ),
  },
  {
    path: 'bank-accounts',
    loadComponent: () =>
      import('./bank-accounts/bank-accounts.component').then((m) => m.BankAccountsComponent),
  },
];
