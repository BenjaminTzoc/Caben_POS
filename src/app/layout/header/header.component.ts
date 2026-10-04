import { Component, EventEmitter, inject, Input, Output, signal, computed, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { filter, Subscription } from 'rxjs';

import { AuthService } from '../../auth/auth.service';
import { CashRegisterService } from '../../inventory/services/cash-register.service';
import { BranchContextService } from '../../core/services/branch-context.service';
import { ThemeService } from '../../core/services/theme.service';
import { CashSessionDialogComponent } from '../../shared/components/cash-session-dialog/cash-session-dialog.component';
import { MenuItem } from '../sidebar/menu-items';
import { CompanySettingsComponent } from '../../pages/company-settings/company-settings.component';

import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';

interface CommandItem {
  label: string;
  category: string;
  icon: string;
  route: string;
  description?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CashSessionDialogComponent,
    CompanySettingsComponent,
    TooltipModule,
    DialogModule,
    DrawerModule,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  animations: [
    trigger('submenuAnimation', [
      transition(':enter', [
        style({ height: '0', opacity: 0 }),
        animate('200ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1 }),
        animate('150ms ease-in', style({ height: '0', opacity: 0 }))
      ])
    ])
  ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<boolean>();

  private authService = inject(AuthService);
  private cashService = inject(CashRegisterService);
  private branchContext = inject(BranchContextService);
  public themeService = inject(ThemeService);
  private router = inject(Router);

  // Modals & Drawers
  showCashDialog = signal(false);
  mobileMenuVisible = signal(false);
  searchModalVisible = signal(false);
  searchQuery = signal('');
  notificationsOpen = signal(false);
  userMenuOpen = signal(false);
  branchMenuOpen = signal(false);
  showCompanySettings = signal(false);
  
  // Live Clock
  currentTime = signal(new Date());
  private clockInterval?: any;

  // Active Branch Context
  currentBranch = computed(() => this.branchContext.currentBranch());
  isSuperAdmin = computed(() => this.authService.isSuperAdmin);

  menuItems = computed(() => {
    const items = this.authService.mainMenuSignal();
    if (!this.branchContext.isGlobalView) {
      return items.filter(
        (item) =>
          item.label.toLowerCase() !== 'catálogos' &&
          item.label.toLowerCase() !== 'catalogos' &&
          item.route !== '/catalogs'
      );
    }
    return items;
  });
  expandedItem: string | null = null;
  activeRoute = '';
  private routerSub?: Subscription;

  // Dynamic Command Palette Items
  commandList = computed<CommandItem[]>(() => {
    const items: CommandItem[] = [];
    const addedRoutes = new Set<string>();

    const main = this.menuItems() || [];
    const recurrent = this.authService.recurrentMenuSignal() || [];

    const processItem = (item: MenuItem, categoryName?: string) => {
      if (item.children && item.children.length > 0) {
        item.children.forEach((child) => processItem(child, categoryName || item.label));
      } else if (item.route && item.route.trim() !== '') {
        if (!addedRoutes.has(item.route)) {
          addedRoutes.add(item.route);
          items.push({
            label: item.label,
            category: categoryName || 'General',
            icon: item.icon || 'pi pi-chevron-right',
            route: item.route,
            description: `Ir a ${item.label}`,
          });
        }
      }
    };

    main.forEach((item) => processItem(item));
    recurrent.forEach((item) => processItem(item, 'Accesos'));

    return items;
  });

  private normalizeText(text: string): string {
    return (text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  filteredCommands = computed(() => {
    const rawQuery = this.searchQuery();
    const q = this.normalizeText(rawQuery);
    const list = this.commandList();
    if (!q) return list;

    return list.filter((item) => {
      const label = this.normalizeText(item.label);
      const category = this.normalizeText(item.category);
      const description = this.normalizeText(item.description || '');
      return label.includes(q) || category.includes(q) || description.includes(q);
    });
  });

  currentSectionInfo = computed(() => {
    const url = this.activeRoute;
    if (url.startsWith('/sales/orders')) return { title: 'Órdenes de Venta', module: 'Ventas', icon: 'pi pi-shopping-cart' };
    if (url.startsWith('/sales/quick-sale') || url.startsWith('/sales/pos')) return { title: 'Punto de Venta (POS)', module: 'Ventas', icon: 'pi pi-bolt' };
    if (url.startsWith('/sales/quotations')) return { title: 'Cotizaciones', module: 'Ventas', icon: 'pi pi-file-edit' };
    if (url.startsWith('/sales/customers')) return { title: 'Clientes', module: 'Ventas', icon: 'pi pi-users' };
    if (url.startsWith('/logistics/settlements')) return { title: 'Liquidación Diaria', module: 'Administración', icon: 'pi pi-calculator' };
    if (url.startsWith('/inventory/products')) return { title: 'Catálogo de Productos', module: 'Inventario', icon: 'pi pi-shopping-bag' };
    if (url.startsWith('/inventory/inventories')) return { title: 'Inventario de Stock', module: 'Inventario', icon: 'pi pi-box' };
    if (url.startsWith('/inventory/inventory-movements')) return { title: 'Movimientos de Stock', module: 'Inventario', icon: 'pi pi-arrows-alt' };
    if (url.startsWith('/inventory/inventory-transfers')) return { title: 'Traslados de Stock', module: 'Inventario', icon: 'pi pi-sync' };
    if (url.startsWith('/inventory/branches')) return { title: 'Sucursales', module: 'Configuración', icon: 'pi pi-building' };
    if (url.startsWith('/purchases')) return { title: 'Compras & Proveedores', module: 'Compras', icon: 'pi pi-truck' };
    if (url.startsWith('/dashboard/profile')) return { title: 'Mi Perfil', module: 'Usuario', icon: 'pi pi-user' };
    if (url.startsWith('/dashboard/settings')) return { title: 'Configuración del Sistema', module: 'Ajustes', icon: 'pi pi-cog' };
    return { title: 'Panel de Control', module: 'Dashboard', icon: 'pi pi-home' };
  });

  notifications = [
    { id: 1, title: 'Caja Principal', text: 'Turno de caja activo y sincronizado', time: 'En vivo', icon: 'pi pi-wallet', type: 'success' },
    { id: 2, title: 'Órdenes de Hoy', text: 'Tienes órdenes pendientes de despacho', time: 'Hace 10 min', icon: 'pi pi-shopping-cart', type: 'info' },
    { id: 3, title: 'Sistema POS', text: 'Conexión en línea y segura', time: 'Hoy', icon: 'pi pi-check-circle', type: 'success' },
  ];

  get currentCashSession() {
    return this.cashService.currentSession;
  }

  get currentUser() {
    return this.authService.currentUser;
  }

  get userInitials() {
    const name = this.currentUser?.name || 'User';
    return name.split(' ')
      .filter((n) => n.length > 0)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  ngOnInit() {
    this.cashService.getStatus().subscribe();
    this.activeRoute = this.router.url;
    this.autoExpandActiveRoute();
    
    this.clockInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);

    this.routerSub = this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.activeRoute = (event as NavigationEnd).urlAfterRedirects;
      this.autoExpandActiveRoute();
      this.notificationsOpen.set(false);
      this.userMenuOpen.set(false);
      this.branchMenuOpen.set(false);
    });
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.openSpotlight();
    }
  }

  openSpotlight() {
    this.searchQuery.set('');
    this.searchModalVisible.set(true);
  }

  closeSpotlight() {
    this.searchModalVisible.set(false);
  }

  executeCommand(route: string) {
    this.searchModalVisible.set(false);
    this.router.navigate([route]);
  }

  autoExpandActiveRoute() {
    for (const item of this.menuItems()) {
      if (item.children && item.children.some((child) => child.route && this.activeRoute.startsWith(child.route))) {
        this.expandedItem = item.label;
        break;
      }
    }
  }

  toggleExpand(label: string) {
    if (this.expandedItem === label) {
      this.expandedItem = null;
    } else {
      this.expandedItem = label;
    }
  }

  isExpanded(label: string): boolean {
    return this.expandedItem === label;
  }

  isActive(item: MenuItem): boolean {
    if (item.children && item.children.length > 0) {
      return item.children.some((child) => this.isActive(child));
    }
    return !!item.route && item.route !== '' && this.activeRoute.startsWith(item.route);
  }

  closeMenu() {
    this.mobileMenuVisible.set(false);
  }

  goToCash() {
    this.showCashDialog.set(true);
  }

  goToPos() {
    this.router.navigate(['/sales/quick-sale']);
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit(!this.sidebarCollapsed);
  }

  openCompanySettings(): void {
    this.userMenuOpen.set(false);
    this.showCompanySettings.set(true);
  }

  goToSelectBranch(): void {
    this.userMenuOpen.set(false);
    this.branchMenuOpen.set(false);
    this.router.navigate(['/select-branch']);
  }

  logout(): void {
    this.userMenuOpen.set(false);
    this.branchMenuOpen.set(false);
    this.branchContext.clear();
    this.authService.logout();
  }

  toggleNotifications(event?: Event) {
    if (event) event.stopPropagation();
    this.userMenuOpen.set(false);
    this.branchMenuOpen.set(false);
    this.notificationsOpen.set(!this.notificationsOpen());
  }

  toggleUserMenu(event?: Event) {
    if (event) event.stopPropagation();
    this.notificationsOpen.set(false);
    this.branchMenuOpen.set(false);
    this.userMenuOpen.set(!this.userMenuOpen());
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.notificationsOpen.set(false);
    this.userMenuOpen.set(false);
    this.branchMenuOpen.set(false);
  }
}