import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AdhesionModalService } from './adhesion-modal.service';

@Component({
  selector: 'app-adhesion-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './adhesion-modal.html',
  styleUrl: './adhesion-modal.css',
})
export class AdhesionModalComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly adhesionModal = inject(AdhesionModalService);

  protected readonly currentStep = signal(1);

  readonly form = this.fb.nonNullable.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telephone: ['', Validators.required],
    dateNaissance: ['', Validators.required],
    statut: ['' as 'etudiant' | 'professionnel' | '', Validators.required],
  });

  protected close(): void {
    this.adhesionModal.close();
    this.currentStep.set(1);
    this.form.reset({ statut: '' });
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.adhesionModal.isOpen()) {
      this.close();
    }
  }

  protected next(): void {
    if (this.currentStep() === 1) {
      this.form.markAllAsTouched();
      const f = this.form.controls;
      if (
        f.nom.invalid ||
        f.prenom.invalid ||
        f.email.invalid ||
        f.telephone.invalid ||
        f.dateNaissance.invalid ||
        f.statut.invalid
      ) {
        return;
      }
    }
    if (this.currentStep() < 3) {
      this.currentStep.update((s) => s + 1);
    }
  }

  protected prev(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((s) => s - 1);
    }
  }

  protected submit(): void {
    this.close();
  }

  protected setStatut(value: 'etudiant' | 'professionnel'): void {
    this.form.patchValue({ statut: value });
  }
}
