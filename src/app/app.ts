import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { ConfirmationModalComponent } from './shared/components/confirmation-modal/confirmation-modal.component';
import { ConfirmService } from './shared/services/confirm.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [RouterOutlet, Toast, ConfirmationModalComponent],
  providers: [MessageService],
})
export class App {
  protected readonly title = signal('sistema-pos-frontend');
  readonly confirm = inject(ConfirmService);
}
