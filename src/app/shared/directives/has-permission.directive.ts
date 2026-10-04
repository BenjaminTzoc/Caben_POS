import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect, effect as runEffect } from '@angular/core';
import { AuthService } from '../../auth/auth.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private authService = inject(AuthService);

  private permissions: string[] = [];
  private isHidden = true;

  @Input('appHasPermission') set appHasPermission(val: string | string[]) {
    if (typeof val === 'string') {
      this.permissions = [val];
    } else if (Array.isArray(val)) {
      this.permissions = val;
    } else {
      this.permissions = [];
    }
    this.updateView();
  }

  constructor() {
    this.authService.user$.subscribe(() => {
      this.updateView();
    });
  }

  private updateView(): void {
    if (this.permissions.length === 0) {
      this.show();
      return;
    }

    const hasAccess =
      this.authService.isSuperAdmin ||
      this.authService.hasAnyPermission(this.permissions);

    if (hasAccess) {
      this.show();
    } else {
      this.hide();
    }
  }

  private show(): void {
    if (this.isHidden) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isHidden = false;
    }
  }

  private hide(): void {
    if (!this.isHidden) {
      this.viewContainer.clear();
      this.isHidden = true;
    }
  }
}