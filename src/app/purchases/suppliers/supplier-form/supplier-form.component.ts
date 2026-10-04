import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SuppliersService } from '../../services/suppliers.service';
import { TextareaModule } from 'primeng/textarea';
import { Supplier } from '../../interfaces/supplier.interface';
import { InputMaskModule } from 'primeng/inputmask';
import { CommonModule } from '@angular/common';

import { ThemeService } from '../../../core/services/theme.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { SecondaryButtonComponent } from '../../../shared/components/secondary-button/secondary-button.component';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    TextareaModule,
    InputMaskModule,
    CommonModule,
    PageHeaderComponent,
    PrimaryButtonComponent,
    SecondaryButtonComponent,
  ],
  templateUrl: './supplier-form.component.html',
  styleUrl: './supplier-form.component.css',
})
export class SupplierFormComponent implements OnInit {
  public themeService = inject(ThemeService);
  private fb = inject(FormBuilder);
  private confirmService = inject(ConfirmService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private supplierService = inject(SuppliersService);
  private route = inject(ActivatedRoute);

  supplierId: string | null = null;
  selectedSupplier: Supplier | null = null; //SOLO PARA EDICION
  isEditMode: boolean = false;
  supplierForm!: FormGroup;

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.supplierId;
    this.initializeForm();

    if (this.isEditMode) {
      this.loadSupplier(this.supplierId!);
    }
  }

  loadSupplier(id: string): void {
    this.supplierService.getSupplier(id).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.selectedSupplier = res.data;
          this.supplierForm.patchValue(this.selectedSupplier);
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se pudo cargar el proveedor: ${err.error?.message || err.message}`,
        });
      },
    });
  }

  initializeForm(): void {
    this.supplierForm = this.fb.group({
      name: ['', [Validators.required]],
      nit: [''],
      contactName: ['', [Validators.required]],
      email: [''],
      phone: ['', [Validators.required]],
      address: [''],
      accountNumber: [''],
      notes: [''],
    });
  }

  onCancelProccess(): void {
    this.confirmService.confirm({
      message: '¿Estás seguro de cancelar este proceso?',
      header: 'Confirmar cancelación',
      icon: 'pi pi-info-circle',
      cancelLabel: 'Regresar',
      
      confirmLabel: 'Cancelar proceso',
      type: 'danger',

      accept: () => {
        this.router.navigate(['purchases/suppliers']);
      },
    });
  }

  onSaveSupplier(): void {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, completa todos los campos requeridos',
      });
      return;
    }

    const body = this.supplierForm.value;
    const request = !this.isEditMode
      ? this.supplierService.createSupplier(body)
      : this.supplierService.editSupplier(this.selectedSupplier!.id, body);

    request.subscribe({
      next: (res) => {
        if (this.isEditMode ? res.statusCode === 200 : res.statusCode === 201) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `El proveedor se ha ${this.isEditMode ? 'modificado' : 'creado'} correctamente.`,
          });
          this.router.navigate(['/purchases/suppliers']);
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error ${this.isEditMode ? 'modificando' : 'creando'} el proveedor: ${err.error.message}`,
        });
      },
      complete: () => {},
    });
  }
}
