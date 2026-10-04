import { Routes } from '@angular/router';
import { permissionGuard } from '../auth/permission.guard';
import { globalOnlyGuard } from '../auth/global-only.guard';

export const LOGISTICS_ROUTES: Routes = [
  {
    path: 'trips',
    canActivate: [permissionGuard],
    data: { permission: 'logistics.trips' },
    loadComponent: () => import('./pages/trips/trips.component').then(m => m.TripsComponent),
  },
  {
    path: 'trips/new',
    canActivate: [permissionGuard],
    data: { permission: 'logistics.trips' },
    loadComponent: () => import('./pages/trips/trip-form/trip-form.component').then(m => m.TripFormComponent),
  },
  {
    path: 'trips/:id',
    canActivate: [permissionGuard],
    data: { permission: 'logistics.trips' },
    loadComponent: () => import('./pages/trips/trip-detail/trip-detail.component').then(m => m.TripDetailComponent),
  },
  {
    path: 'trucks',
    canActivate: [permissionGuard],
    data: { permission: 'logistics.trucks' },
    loadComponent: () => import('./pages/trucks/trucks.component').then(m => m.TrucksComponent),
  },
  {
    path: 'areas',
    canActivate: [permissionGuard, globalOnlyGuard],
    data: { permission: 'areas.manage' },
    loadComponent: () => import('./pages/areas/areas.component').then(m => m.AreasComponent),
  },
  {
    path: 'new-area',
    canActivate: [permissionGuard, globalOnlyGuard],
    data: { permission: 'areas.manage' },
    loadComponent: () => import('./pages/areas/area-form/area-form.component').then(m => m.AreaFormComponent),
  },
  {
    path: 'edit-area/:id',
    canActivate: [permissionGuard, globalOnlyGuard],
    data: { permission: 'areas.manage' },
    loadComponent: () => import('./pages/areas/area-form/area-form.component').then(m => m.AreaFormComponent),
  },
  {
    path: 'dispatches',
    canActivate: [permissionGuard],
    data: { permission: 'logistics.trips' },
    loadComponent: () => import('./pages/dispatches/dispatches.component').then(m => m.DispatchesComponent),
  },
  {
    path: 'new-dispatch',
    canActivate: [permissionGuard],
    data: { permission: 'logistics.trips' },
    loadComponent: () => import('./pages/dispatches/dispatch-form/dispatch-form.component').then(m => m.DispatchFormComponent),
  },
  {
    path: 'edit-dispatch/:id',
    canActivate: [permissionGuard],
    data: { permission: 'logistics.trips' },
    loadComponent: () => import('./pages/dispatches/dispatch-form/dispatch-form.component').then(m => m.DispatchFormComponent),
  },
  {
    path: 'dispatches/receive/:id',
    canActivate: [permissionGuard],
    data: { permission: 'logistics.trips' },
    loadComponent: () => import('./pages/dispatches/dispatch-receive/dispatch-receive.component').then(m => m.DispatchReceiveComponent),
  },
  {
    path: 'dispatches/liquidate/:id',
    canActivate: [permissionGuard],
    data: { permission: 'logistics.settlements' },
    loadComponent: () => import('./pages/dispatches/dispatch-liquidate/dispatch-liquidate.component').then(m => m.DispatchLiquidateComponent),
  },
  {
    path: 'dispatches/detail/:id',
    canActivate: [permissionGuard],
    data: { permission: 'logistics.trips' },
    loadComponent: () => import('./pages/dispatches/dispatch-detail/dispatch-detail.component').then(m => m.RouteDispatchDetailComponent),
  },
  {
    path: 'returns',
    canActivate: [permissionGuard],
    data: { permission: 'logistics.settlements' },
    loadComponent: () => import('./pages/returns/returns.component').then(m => m.ReturnsComponent),
  },
  {
    path: 'settlements',
    canActivate: [permissionGuard],
    data: { permission: 'logistics.settlements' },
    loadComponent: () => import('./pages/settlements/settlements.component').then(m => m.SettlementsComponent),
  },
  {
    path: 'settlements/today',
    canActivate: [permissionGuard],
    data: { permission: 'logistics.settlements' },
    loadComponent: () => import('./pages/settlements/settlement-form.component').then(m => m.SettlementFormComponent),
  },
  {
    path: 'settlements/:id/edit',
    canActivate: [permissionGuard],
    data: { permission: 'logistics.settlements' },
    loadComponent: () => import('./pages/settlements/settlement-form.component').then(m => m.SettlementFormComponent),
  },
  {
    path: 'settlements/:id',
    canActivate: [permissionGuard],
    data: { permission: 'logistics.settlements' },
    loadComponent: () => import('./pages/settlements/settlement-detail.component').then(m => m.SettlementDetailComponent),
  },
];