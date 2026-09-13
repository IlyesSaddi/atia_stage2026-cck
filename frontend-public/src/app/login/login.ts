import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MembreService } from '../services/membre-service';
import { ToastService } from '../services/toast';
import { ToastComponent } from '../toast/toast';
import { Membre } from '../model/membre.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule, ToastComponent],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {

  loginForm: FormGroup = new FormGroup({});
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private service: MembreService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.loginForm = this.fb.group({
      email: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      ]),
      password: new FormControl('', [Validators.required])
    });
  }

  ngOnInit(): void {
    if (this.service.isLoggedIn()) {
      this.router.navigate(['/tableau-de-bord']);
    }
  }

  get email() { return this.loginForm.get('email'); }
  get mp() { return this.loginForm.get('password'); }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;
    const membre: Membre = { email, password };

    this.service.login(membre).subscribe({
      next: res => {
        localStorage.setItem('membreToken', res.token);
        this.router.navigate(['/tableau-de-bord']);
      },
      error: err => {
        if (err.status === 403) {
          this.toastService.error('Accès refusé', 'Compte non actif ou en attente');
        } else {
          this.toastService.error('Échec de connexion', 'Email ou mot de passe incorrect');
        }
      }
    });
  }
}