import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { RefreshButtonComponent } from '../../../shared/components/refresh-button/refresh-button.component';
import { SecondaryButtonComponent } from '../../../shared/components/secondary-button/secondary-button.component';
import { BranchSelectComponent } from '../../../shared/components/branch-select/branch-select.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { BranchSettlementsService } from '../../services/branch-settlements.service';
import { BranchSettlement, BranchSettlementIncident, BranchSettlementItem } from '../../interfaces/branch-settlement.interface';
import { AuthService } from '../../../auth/auth.service';
import { BranchesService } from '../../../inventory/services/branches.service';
import { Branch } from '../../../inventory/interfaces/branch.interface';
import { environment } from '../../../../environments/environment';
import { prepareIncidentPhoto } from '../../../piloto/utils/incident-photo';

@Component({
  selector: 'app-settlement-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    DecimalPipe,
    InputNumberModule,
    SelectModule,
    TextareaModule,
    PageHeaderComponent,
    PrimaryButtonComponent,
    RefreshButtonComponent,
    SecondaryButtonComponent,
    BranchSelectComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './settlement-form.component.html',
})
export class SettlementFormComponent implements OnInit {
  private api = inject(BranchSettlementsService);
  private messages = inject(MessageService);
  private auth = inject(AuthService);
  private branchesApi = inject(BranchesService);
  router = inject(Router);

  loading = signal(false);
  saving = signal(false);
  reporting = signal(false);
  settlement = signal<BranchSettlement | null>(null);
  notes = '';
  branches: Branch[] = [];
  selectedBranchId = '';
  needsBranchPicker = false;
  blockedNoBranch = false;
  incidentOpen = false;
  editingIncidentId: string | null = null;
  incidentProductId = '';
  incidentQty: number | null = null;
  incidentDraft = '';
  incidentAttachments: { file: File; url: string }[] = [];

  ngOnInit(): void {
    const user = this.auth.currentUser as any;
    const assigned = user?.branch?.id || user?.branchId;
    this.needsBranchPicker = this.isAdmin(user) && !assigned;
    this.blockedNoBranch = !assigned && !this.isAdmin(user);
    if (this.needsBranchPicker) {
      this.branchesApi.getBranches({ minimal: true }).subscribe({
        next: (res) => (this.branches = res.data || []),
      });
      return;
    }
    if (this.blockedNoBranch) return;
    this.load();
  }

  onBranchPicked(): void {
    if (!this.selectedBranchId) return;
    this.load();
  }

  private isAdmin(user: any): boolean {
    if (this.auth.isSuperAdmin) return true;
    return user?.roles?.some((r: any) => {
      const name = String(r?.name || r || '').toLowerCase();
      return name === 'admin' || name === 'administrador';
    });
  }

  load(): void {
    if (this.needsBranchPicker && !this.selectedBranchId) return;
    this.loading.set(true);
    this.api.getToday(this.selectedBranchId || undefined).subscribe({
      next: (res) => {
        if (res.data.status && res.data.status !== 'draft') {
          this.loading.set(false);
          this.router.navigate(['/logistics/settlements', res.data.id]);
          return;
        }
        this.settlement.set({ ...res.data, incidents: res.data.incidents || [] });
        this.notes = res.data.notes || '';
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.messages.add({
          severity: 'error',
          summary: 'Liquidación',
          detail: err.error?.message || 'No se pudo abrir la liquidación',
        });
      },
    });
  }

  syncLine(item: BranchSettlementItem): void {
    const system = Math.max(0, Number(item.systemQty) || 0);
    const waste = Math.max(0, Number(item.wasteQty) || 0);
    const maxKeep = Math.max(0, system - waste);
    let keep = Math.max(0, Number(item.keepQty) || 0);
    if (keep > maxKeep) keep = maxKeep;
    item.countedQty = system;
    item.keepQty = Math.round(keep * 1000) / 1000;
    item.wasteQty = waste;
    item.returnQty = Math.round((system - item.keepQty - waste) * 1000) / 1000;
  }

  lineOk(item: BranchSettlementItem): boolean {
    const sum = Number(item.keepQty) + Number(item.returnQty) + Number(item.wasteQty);
    return Math.abs(sum - Number(item.systemQty)) < 0.001;
  }

  productImageUrl(url?: string | null): string {
    if (!url) return `${environment.baseUrl}/uploads/products/default-product.png`;
    return url.startsWith('http') ? url : `${environment.baseUrl}${url}`;
  }

  unitOf(item: BranchSettlementItem): string {
    return item.unitAbbreviation || 'un';
  }

  qtyDigits(item: BranchSettlementItem): string {
    return item.allowsDecimals ? '1.2-2' : '1.0-0';
  }

  cashStatusLabel(status: string): string {
    return status === 'OPEN' || status === 'open' ? 'Abierta' : 'Cerrada';
  }

  cashStatusSeverity(status: string): 'success' | 'secondary' {
    return status === 'OPEN' || status === 'open' ? 'success' : 'secondary';
  }

  canSubmit(): boolean {
    const doc = this.settlement();
    if (!doc || doc.status !== 'draft' || this.saving()) return false;
    return (doc.items || []).every((item) => this.lineOk(item));
  }

  goBack(): void {
    this.clearLocalIncidentUrls();
    this.router.navigate(['/logistics/settlements']);
  }

  private applyWaste(doc: BranchSettlement): void {
    for (const item of doc.items) {
      item.wasteQty = (doc.incidents || [])
        .filter((inc) => inc.productId === item.productId)
        .reduce((sum, inc) => sum + Number(inc.quantity || 0), 0);
      this.syncLine(item);
    }
  }

  saveAndSubmit(): void {
    const doc = this.settlement();
    if (!doc || !this.canSubmit()) return;
    this.saving.set(true);
    const incidents = doc.incidents || [];
    this.api
      .submitToday({
        branchId: this.selectedBranchId || doc.branchId || undefined,
        notes: this.notes,
        items: doc.items.map((item) => ({
          productId: item.productId,
          keepQty: Number(item.keepQty),
        })),
        incidents: incidents.map((inc) => ({
          productId: inc.productId as string,
          quantity: Number(inc.quantity),
          description: inc.description,
        })),
        incidentFiles: incidents.map((inc) => inc.files || []),
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.clearLocalIncidentUrls();
          this.settlement.set(res.data);
          this.messages.add({
            severity: 'success',
            summary: 'Liquidación enviada',
            detail: res.data.transferId
              ? `Traslado ${res.data.transferNumber || ''} quedó pendiente. Asigne camión y piloto para el viaje de retorno.`
              : 'No hay producto para devolver a planta.',
          });
          if (res.data.transferId) {
            this.router.navigate(['/logistics/trips/new'], {
              queryParams: {
                originBranchId: res.data.branchId,
                transferId: res.data.transferId,
              },
            });
          } else {
            this.router.navigate(['/logistics/settlements']);
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.messages.add({
            severity: 'error',
            summary: 'No se envió',
            detail: err.error?.message || 'Revise cantidades e incidencias',
          });
        },
      });
  }

  openIncident(item?: BranchSettlementItem, incident?: BranchSettlementIncident): void {
    const doc = this.settlement();
    if (!doc || doc.status !== 'draft') return;
    this.incidentOpen = true;
    this.editingIncidentId = incident?.id || null;
    this.incidentProductId = incident?.productId || item?.productId || doc.items[0]?.productId || '';
    this.incidentQty = incident != null ? Number(incident.quantity) : null;
    this.incidentDraft = incident?.description || '';
    this.clearIncidentAttachments();
  }

  cancelIncident(): void {
    this.incidentOpen = false;
    this.editingIncidentId = null;
    this.incidentDraft = '';
    this.incidentQty = null;
    this.clearIncidentAttachments();
  }

  editingIncident(): BranchSettlementIncident | null {
    const id = this.editingIncidentId;
    if (!id) return null;
    return this.settlement()?.incidents?.find((item) => item.id === id) || null;
  }

  visibleIncidents(): BranchSettlementIncident[] {
    const rows = this.settlement()?.incidents || [];
    const editingId = this.editingIncidentId;
    if (!editingId) return rows;
    return rows.filter((item) => item.id !== editingId);
  }

  incidentUnit(): string {
    const doc = this.settlement();
    const item = doc?.items.find((row) => row.productId === this.incidentProductId);
    return item ? this.unitOf(item) : 'un';
  }

  incidentAllowsDecimals(): boolean {
    const doc = this.settlement();
    const item = doc?.items.find((row) => row.productId === this.incidentProductId);
    return !!item?.allowsDecimals;
  }

  async onIncidentFiles(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const selected = Array.from(input.files ?? []);
    input.value = '';
    const next = [...this.incidentAttachments];
    for (const file of selected) {
      if (next.length >= 5) {
        this.messages.add({ severity: 'warn', summary: 'Anexo', detail: 'Puede adjuntar hasta 5 fotos.' });
        break;
      }
      try {
        const prepared = await prepareIncidentPhoto(file);
        next.push({ file: prepared, url: URL.createObjectURL(prepared) });
      } catch {
        this.messages.add({
          severity: 'warn',
          summary: 'Anexo',
          detail: 'No se pudo usar esa foto. Pruebe otra.',
        });
      }
    }
    this.incidentAttachments = next;
  }

  removeIncidentAttachment(index: number): void {
    const next = [...this.incidentAttachments];
    const [removed] = next.splice(index, 1);
    if (removed) URL.revokeObjectURL(removed.url);
    this.incidentAttachments = next;
  }

  private clearIncidentAttachments(): void {
    for (const item of this.incidentAttachments) URL.revokeObjectURL(item.url);
    this.incidentAttachments = [];
  }

  submitIncident(): void {
    const doc = this.settlement();
    if (!doc || this.reporting()) return;
    const description = this.incidentDraft.trim();
    const qty = Number(this.incidentQty);
    const product = doc.items.find((item) => item.productId === this.incidentProductId);
    if (!this.incidentProductId || !description || !(qty > 0) || !product) {
      this.messages.add({
        severity: 'warn',
        summary: 'Incidencia',
        detail: 'Indique producto, cantidad de merma y qué pasó.',
      });
      return;
    }
    const nextFiles = this.incidentAttachments.map((item) => item.file);
    const nextUrls = this.incidentAttachments.map((item) => item.url);
    const incidents = [...(doc.incidents || [])];
    if (this.editingIncidentId) {
      const index = incidents.findIndex((inc) => inc.id === this.editingIncidentId);
      if (index >= 0) {
        const prev = incidents[index];
        incidents[index] = {
          ...prev,
          productId: product.productId,
          productName: product.productName,
          quantity: qty,
          description,
          files: [...(prev.files || []), ...nextFiles],
          attachmentUrls: [...(prev.attachmentUrls || []), ...nextUrls],
        };
      }
    } else {
      incidents.push({
        id: crypto.randomUUID(),
        productId: product.productId,
        productName: product.productName,
        quantity: qty,
        description,
        status: 'open',
        files: nextFiles,
        attachmentUrls: nextUrls,
      });
    }
    this.incidentAttachments = [];
    const updated = { ...doc, incidents };
    this.applyWaste(updated);
    this.settlement.set(updated);
    this.incidentOpen = false;
    this.editingIncidentId = null;
    this.incidentDraft = '';
    this.incidentQty = null;
  }

  removeIncident(incident: BranchSettlementIncident): void {
    const doc = this.settlement();
    if (!doc || doc.status !== 'draft') return;
    for (const url of incident.attachmentUrls || []) {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    }
    const updated = {
      ...doc,
      incidents: (doc.incidents || []).filter((inc) => inc.id !== incident.id),
    };
    this.applyWaste(updated);
    this.settlement.set(updated);
    if (this.editingIncidentId === incident.id) this.cancelIncident();
  }

  private clearLocalIncidentUrls(): void {
    const doc = this.settlement();
    for (const inc of doc?.incidents || []) {
      for (const url of inc.attachmentUrls || []) {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      }
    }
    this.clearIncidentAttachments();
  }
}
