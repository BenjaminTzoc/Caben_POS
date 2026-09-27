import { Component, inject, OnDestroy, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeaderComponent } from '../header/header.component';
import { ModernSidebarComponent } from '../modern-sidebar/modern-sidebar.component';

@Component({
  selector: 'app-dashboard-layout',
  imports: [HeaderComponent, ModernSidebarComponent, RouterOutlet],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.css',
})
export class DashboardLayoutComponent implements OnDestroy {
  private router = inject(Router);
  private routerSub: Subscription;

  isSidebarCollapsed = false;
  navigating = signal(false);

  constructor() {
    this.routerSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.navigating.set(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.navigating.set(false);
      }
    });
    this.prefetchCommonScreens();
  }

  private prefetchCommonScreens(): void {
    window.setTimeout(() => {
      void import('../../sales/sale-orders/sale-orders.component');
      void import('../../sales/customers/customers.component');
      void import('../../inventory/products/products.component');
      void import('../../inventory/inventories/inventories.component');
      void import('../../purchases/purchase-orders/purchase-orders.component');
    }, 1800);
  }

  ngOnDestroy(): void {
    this.routerSub.unsubscribe();
  }

  onToggleSidebar(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
  }
}
