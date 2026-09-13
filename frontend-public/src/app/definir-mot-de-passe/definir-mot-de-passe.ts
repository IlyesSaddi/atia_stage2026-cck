import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MembreService } from '../services/membre-service';
import { ToastService } from '../services/toast';
import { ToastComponent } from '../toast/toast';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-definir-mot-de-passe',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule, ToastComponent],
  templateUrl: './definir-mot-de-passe.html',
  styleUrl: './definir-mot-de-passe.css',
})
export class DefinirMotDePasse implements OnInit {

  resetForm: FormGroup = new FormGroup({});
  token: string | null = null;
  showPassword = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private service: MembreService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.resetForm = this.fb.group({
      motDePasse: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmation: new FormControl('', [Validators.required])
    }, { validators: this.motsDePasseIdentiques });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.toastService.error('Lien invalide', 'Aucun jeton d\'activation trouvé dans le lien');
    }
  }

  get mp() { return this.resetForm.get('motDePasse'); }
  get conf() { return this.resetForm.get('confirmation'); }

  motsDePasseIdentiques(group: FormGroup): { [key: string]: boolean } | null {
    const a = group.get('motDePasse')?.value;
    const b = group.get('confirmation')?.value;
    return a && b && a !== b ? { nonIdentique: true } : null;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  soumettre(): void {
    if (this.resetForm.invalid || !this.token) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const motDePasse = this.resetForm.value.motDePasse;
    this.loading = true;

    this.service.definirMotDePasse(this.token, motDePasse).subscribe({
      next: () => {
        this.loading = false;
        this.toastService.success('Mot de passe créé', 'Vous pouvez maintenant vous connecter');
        this.router.navigate(['/espace-membre']);
      },
      error: err => {
        this.loading = false;
        const msg = err?.error?.error || err?.error?.message || 'Impossible de créer le mot de passe';
        this.toastService.error('Échec', msg);
      }
    });
  }
}
