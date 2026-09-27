import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { CompanySettingService } from '../../shared/services/company-setting.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RefreshButtonComponent } from '../../shared/components/refresh-button/refresh-button.component';
import { StandardModalComponent } from '../../shared/components/standard-modal/standard-modal.component';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { SecondaryButtonComponent } from '../../shared/components/secondary-button/secondary-button.component';

@Component({
  selector: 'app-company-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    PageHeaderComponent,
    RefreshButtonComponent,
    StandardModalComponent,
    PrimaryButtonComponent,
    SecondaryButtonComponent,
  ],
  templateUrl: './company-settings.component.html',
})
export class CompanySettingsComponent implements OnInit, OnChanges {
  @Input() asModal = false;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  private fb = inject(FormBuilder);
  private companySettingService = inject(CompanySettingService);
  private messageService = inject(MessageService);

  form: FormGroup = this.fb.group({
    companyName: ['', [Validators.required]],
    address: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    nit: ['', [Validators.required]],
  });
  isLoading = signal(false);
  isSaving = signal(false);

  ngOnInit(): void {
    if (!this.asModal) {
      this.loadSettings();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.asModal && changes['visible']?.currentValue) {
      this.loadSettings();
    }
  }

  loadSettings(): void {
    this.isLoading.set(true);
    this.companySettingService.getSettings().subscribe({
      next: (response) => {
        const data = response?.data;
        if (data) {
          this.form.patchValue({
            companyName: data.companyName || '',
            address: data.address || '',
            phone: data.phone || '',
            nit: data.nit || '',
          });
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los datos de la empresa.',
        });
        this.isLoading.set(false);
      },
    });
  }

  hasError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  onVisibleChange(value: boolean): void {
    this.visible = value;
    this.visibleChange.emit(value);
  }

  onClose(): void {
    this.onVisibleChange(false);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.companySettingService.updateSettings(this.form.value).subscribe({
      next: (response) => {
        const data = response?.data;
        this.messageService.add({
          severity: 'success',
          summary: 'Guardado',
          detail: 'Datos de la empresa actualizados exitosamente.',
        });
        if (data) {
          this.form.patchValue({
            companyName: data.companyName || '',
            address: data.address || '',
            phone: data.phone || '',
            nit: data.nit || '',
          });
        }
        this.isSaving.set(false);
        if (this.asModal) {
          this.onClose();
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron guardar los cambios.',
        });
        this.isSaving.set(false);
      },
    });
  }
}
