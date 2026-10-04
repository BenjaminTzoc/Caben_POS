import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService } from 'primeng/api';
import { UnitsService } from '../../services/units.service';
import { UnitMeasure } from '../../interfaces/unit.interface';
import { StandardModalComponent } from '../../../shared/components/standard-modal/standard-modal.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { SecondaryButtonComponent } from '../../../shared/components/secondary-button/secondary-button.component';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-unit-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    ToggleSwitchModule,
    StandardModalComponent,
    PrimaryButtonComponent,
    SecondaryButtonComponent,
  ],
  templateUrl: './unit-modal.component.html',
})
export class UnitModalComponent implements OnChanges {
  public themeService = inject(ThemeService);
  @Input() visible = false;
  @Input() unit: UnitMeasure | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<UnitMeasure>();

  private fb = inject(FormBuilder);
  private unitsService = inject(UnitsService);
  private messageService = inject(MessageService);

  form: FormGroup;
  saving = false;

  get modalTitle(): string {
    return this.unit ? 'Editar unidad de medida' : 'Nueva unidad de medida';
  }

  constructor() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      abbreviation: ['', [Validators.required]],
      allowsDecimals: [false],
      description: [''],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['unit'] && this.unit) {
      this.form.patchValue({
        name: this.unit.name || '',
        abbreviation: this.unit.abbreviation || '',
        allowsDecimals: !!this.unit.allowsDecimals,
        description: this.unit.description || '',
      });
    } else if (changes['visible'] && this.visible && !this.unit) {
      this.form.reset({
        name: '',
        abbreviation: '',
        allowsDecimals: false,
        description: '',
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
      abbreviation: formVal.abbreviation.trim().toUpperCase(),
      allowsDecimals: !!formVal.allowsDecimals,
      description: formVal.description ? formVal.description.trim() : '',
    };

    if (this.unit?.id) {
      this.unitsService.updateUnit(this.unit.id, payload).subscribe({
        next: (res) => {
          this.saving = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Unidad actualizada',
            detail: `La unidad ${res.data?.name || payload.name} se actualizó correctamente.`,
          });
          this.saved.emit(res.data);
          this.onClose();
        },
        error: (err) => {
          this.saving = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo actualizar la unidad de medida.',
          });
        },
      });
    } else {
      this.unitsService.createUnit(payload).subscribe({
        next: (res) => {
          this.saving = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Unidad creada',
            detail: `La unidad ${res.data?.name || payload.name} fue registrada con éxito.`,
          });
          this.saved.emit(res.data);
          this.onClose();
        },
        error: (err) => {
          this.saving = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo crear la unidad de medida.',
          });
        },
      });
    }
  }
}
