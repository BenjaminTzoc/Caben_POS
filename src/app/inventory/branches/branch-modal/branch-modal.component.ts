import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputMaskModule } from 'primeng/inputmask';
import { MessageService } from 'primeng/api';
import { BranchesService } from '../../services/branches.service';
import { Branch } from '../../interfaces/branch.interface';
import { StandardModalComponent } from '../../../shared/components/standard-modal/standard-modal.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { SecondaryButtonComponent } from '../../../shared/components/secondary-button/secondary-button.component';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-branch-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    ToggleSwitchModule,
    InputMaskModule,
    StandardModalComponent,
    PrimaryButtonComponent,
    SecondaryButtonComponent,
  ],
  templateUrl: './branch-modal.component.html',
})
export class BranchModalComponent implements OnChanges {
  public themeService = inject(ThemeService);
  @Input() visible = false;
  @Input() branch: Branch | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<Branch>();

  private fb = inject(FormBuilder);
  private branchesService = inject(BranchesService);
  private messageService = inject(MessageService);

  form: FormGroup;
  saving = false;

  get modalTitle(): string {
    return this.branch ? 'Editar sucursal' : 'Nueva sucursal';
  }

  constructor() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      email: ['', [Validators.email]],
      isPlant: [false],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['branch'] && this.branch) {
      this.form.patchValue({
        name: this.branch.name || '',
        address: this.branch.address || '',
        phone: this.branch.phone || '',
        email: this.branch.email || '',
        isPlant: !!this.branch.isPlant,
      });
    } else if (changes['visible'] && this.visible && !this.branch) {
      this.form.reset({
        name: '',
        address: '',
        phone: '',
        email: '',
        isPlant: false,
      });
    }
  }

  onClose(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const formVal = this.form.value;

    const payload = {
      name: formVal.name.trim(),
      address: formVal.address.trim(),
      phone: formVal.phone.trim(),
      email: formVal.email ? formVal.email.trim() : null,
      isPlant: !!formVal.isPlant,
    };

    if (this.branch?.id) {
      this.branchesService.updateBranch(this.branch.id, payload).subscribe({
        next: (res) => {
          this.saving = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Sucursal actualizada',
            detail: `La sucursal ${res.data.name} se actualizó correctamente.`,
          });
          this.saved.emit(res.data);
          this.onClose();
        },
        error: (err) => {
          this.saving = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo actualizar la sucursal.',
          });
        },
      });
    } else {
      this.branchesService.createBranch(payload).subscribe({
        next: (res) => {
          this.saving = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Sucursal creada',
            detail: `La sucursal ${res.data.name} fue registrada con éxito.`,
          });
          this.saved.emit(res.data);
          this.onClose();
        },
        error: (err) => {
          this.saving = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo crear la sucursal.',
          });
        },
      });
    }
  }
}
