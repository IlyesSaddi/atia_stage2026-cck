import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MembreService } from '../services/membre-service';
import { ToastService } from '../services/toast';
import { ToastComponent } from '../toast/toast';

@Component({
  selector: 'app-mot-de-passe-oublie',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule, ToastComponent],
  templateUrl: './mot-de-passe-oublie.html',
  styleUrl: './mot-de-passe-oublie.css',
})
export class MotDePasseOublie {
  form: FormGroup;
  loading = false;
  envoye = false;
  resetLien: string | null = null;

  constructor(
    private fb: FormBuilder,
    private service: MembreService,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      email: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      ])
    });
  }

  get email() { return this.form.get('email'); }

  soumettre(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.service.motDePasseOublie(this.form.value.email).subscribe({
      next: (res: any) => {
        this.envoye = true;
        this.resetLien = res?.resetLien ?? null;
        this.loading = false;
      },
      error: () => {
        this.envoye = true;
        this.loading = false;
      }
    });
  }
}
