import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
  computed,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { CustomerWeeklyItemDto } from '../../../core/models/reports.models';
import { PrintService } from '../../services/print.service';
import { ReportsService } from '../../../core/services/reports.service';
import { CompanySettingService } from '../../services/company-setting.service';
import { CustomersService } from '../../../sales/services/customers.service';
import { BranchesService } from '../../../inventory/services/branches.service';
import { ICustomer } from '../../../sales/interfaces/customer.interface';

@Component({
  selector: 'app-weekly-consolidated-preview',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, ButtonModule, DialogModule, TooltipModule],
  templateUrl: './weekly-consolidated-preview.component.html',
  styleUrl: './weekly-consolidated-preview.component.css',
})
export class WeeklyConsolidatedPreviewComponent implements OnInit, OnChanges {
  private printService = inject(PrintService);
  private reportsService = inject(ReportsService);
  private companySettingService = inject(CompanySettingService);
  private customersService = inject(CustomersService);
  private branchesService = inject(BranchesService);
  private messageService = inject(MessageService);

  @Input() customer: CustomerWeeklyItemDto | null = null;
  @Input() period: { start: string; end: string } | null = null;
  @Input() branchId?: string;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  customerDetails = signal<ICustomer | null>(null);
  branchName = signal<string>('Todas las sucursales');

  isPrinting = signal(false);
  isDownloading = signal(false);
  isSendingEmail = signal(false);
  isSendingWhatsApp = signal(false);

  today = new Date();
  Math = Math;

  companyInfo = {
    name: 'SISTEMA POS',
    address: '10a ave. A, 4-48 zona 1, Ciudad de Guatemala',
    phone: '40635516',
    email: 'contacto@pos.com',
    nit: '10898632-2',
    logo: 'logo.png',
  };

  periodLabel = computed(() => {
    const p = this.period;
    if (p && p.start && p.end) {
      return `${p.start} al ${p.end}`;
    }
    return 'Semana activa';
  });

  ngOnInit(): void {
    this.companySettingService.getSettings().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.companyInfo.address = res.data.address || this.companyInfo.address;
          this.companyInfo.phone = res.data.phone || this.companyInfo.phone;
          this.companyInfo.nit = res.data.nit || this.companyInfo.nit;
          this.companyInfo.name = res.data.companyName || this.companyInfo.name;
          if (res.data.logoUrl) {
            this.companyInfo.logo = res.data.logoUrl;
          }
        }
      },
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.customer) {
      this.loadCustomerDetails();
      this.loadBranchInfo();
    }
  }

  private loadCustomerDetails(): void {
    if (this.customer?.id && !this.customer.isGuest) {
      this.customersService.getCustomer(this.customer.id).subscribe({
        next: (res) => {
          this.customerDetails.set(res.data ?? null);
        },
        error: () => {
          this.customerDetails.set(null);
        },
      });
    } else {
      this.customerDetails.set(null);
    }
  }

  private loadBranchInfo(): void {
    if (this.branchId) {
      this.branchesService.getBranch(this.branchId).subscribe({
        next: (res) => {
          this.branchName.set(res.data?.name || 'Sucursal Seleccionada');
        },
        error: () => {
          this.branchName.set('Planta Central');
        },
      });
    } else {
      this.branchName.set('Todas las sucursales');
    }
  }

  sparkMax(): number {
    if (!this.customer?.days?.length) return 1;
    return Math.max(...this.customer.days.map((d) => d.total), 1);
  }

  barHeight(total: number): number {
    return Math.round((total / this.sparkMax()) * 100);
  }

  dayAmountLabel(total: number): string {
    if (!total) return '—';
    return `Q${total.toLocaleString('es-GT', { maximumFractionDigits: 0 })}`;
  }

  creditPercent(): number {
    if (!this.customer?.creditLimit) return 0;
    return Math.min(100, Math.round((this.customer.creditUsed / this.customer.creditLimit) * 100));
  }

  formatIsoDate(value: string): string {
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  }

  onPrint(): void {
    if (this.isPrinting() || !this.customer) return;
    this.isPrinting.set(true);

    const customerId = !this.customer.isGuest ? this.customer.id || undefined : undefined;
    const startDate = this.period?.start;
    const endDate = this.period?.end;

    this.reportsService.generateWeeklyConsolidatedPdf(customerId, startDate, endDate, this.branchId).subscribe({
      next: (blob) => {
        this.printService.printPDF(blob);
        this.isPrinting.set(false);
      },
      error: async (err) => {
        console.warn('Backend PDF endpoint error, using client-side generator...', err);
        try {
          const blob = await this.printService.generatePDF('weekly-consolidated-doc', 'letter');
          this.printService.printPDF(blob);
        } catch (e) {
          console.error('Failed to generate print PDF:', e);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo generar el documento para impresión.',
          });
        }
        this.isPrinting.set(false);
      },
    });
  }

  onDownload(): void {
    if (this.isDownloading() || !this.customer) return;
    this.isDownloading.set(true);

    const customerId = !this.customer.isGuest ? this.customer.id || undefined : undefined;
    const startDate = this.period?.start || '';
    const endDate = this.period?.end || '';
    const safeName = (this.customer.name || 'Cliente').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Consolidado_Semanal_${safeName}_${startDate}_${endDate}`;

    this.reportsService.generateWeeklyConsolidatedPdf(customerId, startDate, endDate, this.branchId).subscribe({
      next: (blob) => {
        this.printService.downloadPDF(blob, filename);
        this.messageService.add({
          severity: 'success',
          summary: 'Descarga Completa',
          detail: 'Consolidado semanal descargado con éxito.',
        });
        this.isDownloading.set(false);
      },
      error: async (err) => {
        console.warn('Backend download PDF error, generating client-side PDF...', err);
        try {
          const blob = await this.printService.generatePDF('weekly-consolidated-doc', 'letter');
          this.printService.downloadPDF(blob, filename);
          this.messageService.add({
            severity: 'success',
            summary: 'Descarga Completa',
            detail: 'Consolidado semanal generado con éxito.',
          });
        } catch (e) {
          console.error('Failed to download PDF:', e);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo descargar el PDF consolidado semanal.',
          });
        }
        this.isDownloading.set(false);
      },
    });
  }

  async onSendEmail(): Promise<void> {
    if (this.isSendingEmail() || !this.customer) return;

    const email = this.customerDetails()?.email;
    if (!email) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin Email',
        detail: 'El cliente no tiene un correo electrónico registrado.',
      });
      return;
    }

    this.isSendingEmail.set(true);

    try {
      const blob = await this.printService.generatePDF('weekly-consolidated-doc', 'letter');
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result?.toString().split(',')[1];
        // Enlace / notificación
        this.messageService.add({
          severity: 'success',
          summary: 'Preparado para envío',
          detail: `Documento generado para enviar a ${email}.`,
        });
        this.isSendingEmail.set(false);
      };
    } catch (e) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo procesar el documento para correo.',
      });
      this.isSendingEmail.set(false);
    }
  }

  onSendWhatsApp(): void {
    if (this.isSendingWhatsApp() || !this.customer) return;

    const phone = this.customerDetails()?.phone;
    if (!phone) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin Teléfono',
        detail: 'El cliente no tiene un número de teléfono registrado.',
      });
      return;
    }

    this.isSendingWhatsApp.set(true);

    const customerId = !this.customer.isGuest ? this.customer.id || undefined : undefined;
    const customerName = this.customerDetails()?.name || this.customer.name;
    const startDate = this.period?.start;
    const endDate = this.period?.end;

    const payload = {
      customerId,
      customerName,
      phone,
      startDate,
      endDate,
      branchId: this.branchId,
    };

    this.reportsService.sendWeeklyConsolidatedWhatsApp(payload).subscribe({
      next: (res) => {
        this.isSendingWhatsApp.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'WhatsApp Enviado',
          detail: res.message || 'Consolidado semanal enviado por WhatsApp exitosamente.',
        });
      },
      error: (err) => {
        this.isSendingWhatsApp.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al enviar WhatsApp',
          detail: err.error?.message || 'No se pudo enviar el mensaje por WhatsApp.',
        });
      },
    });
  }

  onClose(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
