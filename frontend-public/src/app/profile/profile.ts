import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MembreHeader } from '../membre-header/membre-header';
import { MembreMenu } from '../membre-menu/membre-menu';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MembreService } from '../services/membre-service';
import { ToastService } from '../services/toast';
import { ToastComponent } from '../toast/toast';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [MembreHeader, MembreMenu, RouterModule, CommonModule, FormsModule, ToastComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {

  membre: any = null;
  membreId: number | null = null;
  initiales = '';
  adhesionDate: Date | null = null;
  dateExpiration: Date | null = null;

  email = '';
  telephone = '';
  centresInteret: string[] = [];
  private savedCentresInteret: string[] = [];

  ancienPassword  = '';
  nouveauPassword = '';
  confirmPassword = '';
  showAncien  = false;
  showNouveau = false;
  showConfirm = false;


  downloadingAttestation = false;
  showInteretsModal = false;
  modalInterests: { label: string; selected: boolean }[] = [];

  readonly allInterests = [
    '🤖 Intelligence Artificielle', '🧠 Machine Learning',  '🔬 Deep Learning',
    '📊 Data Science',              '💾 Big Data',           '💬 NLP',
    '👁️ Computer Vision',           '🦾 Robotique',          '🔐 Cybersécurité & IA',
    '🏥 IA & Santé',                '🌱 IA & Agriculture',   '🎓 IA & Éducation',
    '✨ IA Générative',             '📡 IoT & Embarqué',     '⚖️ Éthique de l\'IA',
    '☁️ Cloud',                     '⚙️ MLOps',              '📈 Analyse de données',
  ];

  get modalSelectedCount(): number {
    return this.modalInterests.filter(i => i.selected).length;
  }

  constructor(private membreService: MembreService, private toastService: ToastService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.membreId = this.membreService.getMembreId();
    if (this.membreId) {
      this.membreService.getMembreById(this.membreId).subscribe({
        next: (m) => this.chargerMembre(m),
      });
    }
  }

  private chargerMembre(m: any): void {
    this.membre = m;
    const n = m.nom?.[0]    ?? '';
    const p = m.prenom?.[0] ?? '';
    this.initiales   = (n + p).toUpperCase();
    this.email       = m.email     ?? '';
    this.telephone   = m.telephone ?? '';
    this.centresInteret      = [...(m.centresInteret ?? [])];
    this.savedCentresInteret = [...this.centresInteret];

    if (m.dateAdhesion)
      this.adhesionDate   = new Date(m.dateAdhesion   + 'T00:00:00');
    if (m.dateExpiration)
      this.dateExpiration = new Date(m.dateExpiration  + 'T00:00:00');

    this.cd.detectChanges();
  }



  showToast(message: string, type: 'success' | 'error', title?: string): void {
    const finalTitle = title ?? (type === 'success' ? 'Succès' : 'Erreur');
    if (type === 'success') this.toastService.success(finalTitle, message);
    else this.toastService.error(finalTitle, message);
  }

  private rechargerProfil(): void {
    this.membreService.getMembreById(this.membreId!).subscribe({
      next: (m) => this.chargerMembre(m),
    });
  }



  removeInteret(centre: string): void {
    this.centresInteret = this.centresInteret.filter(c => c !== centre);
  }

  openInteretsModal(): void {
    this.modalInterests = this.allInterests.map(label => ({
      label,
      selected: this.centresInteret.includes(label),
    }));
    this.showInteretsModal = true;
  }

  closeInteretsModal(): void {
    this.showInteretsModal = false;
  }

  toggleModalInterest(i: { label: string; selected: boolean }): void {
    i.selected = !i.selected;
  }

  validerInterets(): void {
    this.centresInteret = this.modalInterests.filter(i => i.selected).map(i => i.label);
    this.showInteretsModal = false;
  }


  sauvegarderContact(): void {
    if (!this.membreId) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email.trim())) {
      this.showToast('Format d\'email invalide (ex: nom@domaine.com).', 'error', 'Email invalide');
      return;
    }

    const phoneClean = (this.telephone ?? '').replace(/\s/g, '');
    const phoneRegex = /^(\+?216)?[2-9][0-9]{7}$|^\+[1-9][0-9]{9,14}$/;
    if (phoneClean && !phoneRegex.test(phoneClean)) {
      this.showToast('Format de téléphone invalide (ex: 22 345 678).', 'error', 'Téléphone invalide');
      return;
    }

    this.membreService.updateContact(this.membreId, this.email.trim(), this.telephone).subscribe({
      next: () => {
        const saved    = new Set(this.savedCentresInteret);
        const current  = new Set(this.centresInteret);
        const toAdd    = [...current].filter(c => !saved.has(c));
        const toRemove = [...saved].filter(c => !current.has(c));

        const calls = [
          ...toAdd.map(c    => this.membreService.addCentreInteret(this.membreId!, c)),
          ...toRemove.map(c => this.membreService.removeCentreInteret(this.membreId!, c)),
        ];

        if (!calls.length) {
          this.savedCentresInteret = [...this.centresInteret];
          this.rechargerProfil();
          this.showToast('Vos informations ont été mises à jour avec succès.', 'success', 'Profil mis à jour');
          return;
        }

        let done = 0;
        calls.forEach(call => call.subscribe({
          next: () => {
            if (++done === calls.length) {
              this.savedCentresInteret = [...this.centresInteret];
              this.rechargerProfil();
              this.showToast('Vos informations ont été mises à jour avec succès.', 'success', 'Profil mis à jour');
            }
          },
          error: () => this.showToast('Impossible de mettre à jour vos centres d\'intérêt. Réessayez.', 'error', 'Échec de la mise à jour'),
        }));
      },
      error: () => this.showToast('Une erreur est survenue lors de la mise à jour de votre profil.', 'error', 'Échec de la mise à jour'),
    });
  }


  downloadAttestation(): void {
    if (!this.membreId || this.downloadingAttestation) return;
    this.downloadingAttestation = true;
    this.membreService.downloadAttestation(this.membreId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attestation_${this.membre?.nom ?? 'membre'}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloadingAttestation = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.showToast('Le téléchargement de votre attestation a échoué. Réessayez.', 'error', 'Téléchargement impossible');
        this.downloadingAttestation = false;
        this.cd.detectChanges();
      },
    });
  }

  // ── Mot de passe ──────────────────────────────────────────────────────────────

  changerMotDePasse(): void {
    if (!this.membreId) return;

    if (!this.ancienPassword) {
      this.showToast('Veuillez saisir votre mot de passe actuel.', 'error', 'Champ manquant');
      return;
    }
    if (!this.nouveauPassword || !this.confirmPassword) {
      this.showToast('Veuillez remplir tous les champs.', 'error', 'Champs manquants');
      return;
    }
    if (this.nouveauPassword !== this.confirmPassword) {
      this.showToast('Les nouveaux mots de passe ne correspondent pas.', 'error', 'Mots de passe différents');
      return;
    }

    const pwdRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!pwdRegex.test(this.nouveauPassword)) {
      this.showToast('Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.', 'error', 'Mot de passe trop faible');
      return;
    }

    this.membreService.changePassword(this.membreId, this.ancienPassword, this.nouveauPassword).subscribe({
      next: () => {
        this.showToast('Votre mot de passe a été mis à jour avec succès.', 'success', 'Mot de passe modifié');
        this.ancienPassword  = '';
        this.nouveauPassword = '';
        this.confirmPassword = '';
        this.cd.detectChanges(); 
      },
      error: (err) => {
  const msg = err.error?.message ?? 'Mot de passe actuel incorrect.';
  
  this.showToast(msg, 'error', 'Échec de la modification');
  this.cd.detectChanges(); 
},

    });
  }
}