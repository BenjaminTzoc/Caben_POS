import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { BranchSettlementsService } from '../../services/branch-settlements.service';
import { BranchSettlement, BranchSettlementItem } from '../../interfaces/branch-settlement.interface';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-settlement-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    CurrencyPipe,
    DecimalPipe,
    CheckboxModule,
    InputNumberModule,
    TextareaModule,
    PageHeaderComponent,
    PrimaryButtonComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './settlement-detail.component.html',
})
export class SettlementDetailComponent implements OnInit {
  private api = inject(BranchSettlementsService);
  private route = inject(ActivatedRoute);
  private messages = inject(MessageService);
  private auth = inject(AuthService);
  router = inject(Router);

  loading = signal(false);
  saving = signal(false);
  settlement = signal<BranchSettlement | null>(null);
  received: Record<string, number> = {};
  registerAsWaste = false;
  resolutionNotes: Record<string, string> = {};

  ngOnInit(): void {
    this.load();
  }

  canResolveIncident(): boolean {
    const user = this.auth.currentUser as any;
    return this.auth.isSuperAdmin || !!user?.branch?.isPlant;
  }

  canReceive(): boolean {
    const user = this.auth.currentUser as any;
    const isPlant = !!user?.branch?.isPlant;
    const doc = this.settlement();
    return (
      (this.auth.isSuperAdmin || isPlant) &&
      !!doc &&
      (doc.status === 'submitted' || doc.status === 'discrepancy') &&
      !!doc.transferId
    );
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'draft':
        return 'Borrador';
      case 'submitted':
        return 'Enviada';
      case 'received':
        return 'Recibida';
      case 'discrepancy':
        return 'Faltante en tránsito';
      default:
        return status;
    }
  }

  statusSeverity(status: string): 'secondary' | 'info' | 'success' | 'danger' {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'submitted':
        return 'info';
      case 'received':
        return 'success';
      case 'discrepancy':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  cashStatusLabel(status: string): string {
    return status === 'OPEN' || status === 'open' ? 'Abierta' : 'Cerrada';
  }

  cashStatusSeverity(status: string): 'success' | 'secondary' {
    return status === 'OPEN' || status === 'open' ? 'success' : 'secondary';
  }

  unitOf(item: BranchSettlementItem): string {
    return item.unitAbbreviation || 'un';
  }

  qtyDigits(item: BranchSettlementItem): string {
    return item.allowsDecimals ? '1.2-2' : '1.0-0';
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loading.set(true);
    this.api.getById(id).subscribe({
      next: (res) => {
        this.settlement.set(res.data);
        this.received = {};
        for (const item of res.data.items || []) {
          if (Number(item.returnQty) > 0) {
            this.received[item.productId] =
              item.receivedQty != null ? Number(item.receivedQty) : Number(item.returnQty);
          }
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.messages.add({
          severity: 'error',
          summary: 'Liquidación',
          detail: err.error?.message || 'No encontrada',
        });
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/logistics/settlements']);
  }

  resolve(incidentId: string): void {
    const doc = this.settlement();
    const notes = (this.resolutionNotes[incidentId] || '').trim();
    if (!doc || !notes) {
      this.messages.add({ severity: 'warn', summary: 'Incidencia', detail: 'Indique notas de resolución' });
      return;
    }
    this.saving.set(true);
    this.api.resolveIncident(doc.id, incidentId, notes).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.settlement.set(res.data);
        this.messages.add({ severity: 'success', summary: 'Incidencia', detail: 'Incidencia resuelta' });
      },
      error: (err) => {
        this.saving.set(false);
        this.messages.add({
          severity: 'error',
          summary: 'Incidencia',
          detail: err.error?.message || 'No se pudo resolver',
        });
      },
    });
  }

  receive(): void {
    const doc = this.settlement();
    if (!doc || !this.canReceive()) return;
    this.saving.set(true);
    const items = Object.entries(this.received).map(([productId, receivedQuantity]) => ({
      productId,
      receivedQuantity: Number(receivedQuantity),
    }));
    this.api.receive(doc.id, { items, registerAsWaste: this.registerAsWaste }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.settlement.set(res.data);
        this.messages.add({
          severity: 'success',
          summary: 'Recepción',
          detail: 'El retorno de liquidación quedó registrado en planta.',
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.messages.add({
          severity: 'error',
          summary: 'No se recibió',
          detail: err.error?.message || 'No se pudo recibir',
        });
      },
    });
  }
}
