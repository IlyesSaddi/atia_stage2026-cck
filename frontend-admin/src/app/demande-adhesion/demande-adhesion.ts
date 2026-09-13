import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Menu } from '../menu/menu';
import { Header } from '../header/header';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MembreService } from '../services/membre.service';
import { Membre } from '../model/Membre.model';
import { StatutMembre } from '../model/Membre.model';
import { NgToastService } from 'ng-angular-popup';
interface Demande {
  reference: string;
  nomComplet: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateSoumission: string;
  statut: 'En attente' | 'Accepté' | 'Refusé';
  cin: string;
  dateNaissance: string;
  statutMembre: string;
  dateAdhesion?: string;
  centresInteret: string[];
}
 
@Component({
  selector: 'app-demande-adhesion',
  imports: [Menu,Header, NgIf, FormsModule, CommonModule, NgForOf],
  templateUrl: './demande-adhesion.html',
  styleUrl: './demande-adhesion.css',
})

export class DemandeAdhesion implements OnInit{
  selectedDemande: Membre | null = null;
  demandes: Membre[] = [];
  activationLien: string | null = null;
  copied = false;

  constructor(private membreService: MembreService,private cdr: ChangeDetectorRef ,  private toast: NgToastService) {}

ngOnInit(): void {
  this.membreService.getMembresEnAttente().subscribe({
    next: (data) => {
      this.demandes = data.map(membre => {
        if (membre.cinImage?.image) {
          membre.cinImageStr = this.bytesToBase64(membre.cinImage.image);
        }
        if (membre.justificatifImage?.image) {
          membre.justificatifImageStr = this.bytesToBase64(membre.justificatifImage.image);
        }
        if (membre.recuPaiementImage?.image) {
          membre.recuPaiementImageStr = this.bytesToBase64(membre.recuPaiementImage.image);
        }
        return membre;
      }).sort((a, b) => {
        const dateA = new Date(a.dateSubmission || 0).getTime();
        const dateB = new Date(b.dateSubmission || 0).getTime();
        return dateB - dateA;
      });
      this.cdr.detectChanges();
    },
    error: (err) => console.error('Erreur chargement membres en attente', err)
  });
}

formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins  = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

formatDateOnly(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  return `${day}/${month}/${year}`;
}

  getPendingCount(): number {
    return this.demandes.filter(d => d.statutMembre === StatutMembre.EN_ATTENTE).length;
  }

  getBadgeClass(statut: StatutMembre | undefined): string {
    const map: Record<string, string> = {
      [StatutMembre.EN_ATTENTE]: 'badge-en-attente',
      [StatutMembre.ACTIF]:      'badge-accepte',
      [StatutMembre.EXPIRE]:     'badge-refuse',
    };
    return statut ? (map[statut] || '') : '';
  }

  getStatutLabel(statut: StatutMembre | undefined): string {
    const map: Record<string, string> = {
      [StatutMembre.EN_ATTENTE]: 'En attente',
      [StatutMembre.ACTIF]:      'Accepté',
      [StatutMembre.EXPIRE]:     'Expiré',
    };
    return statut ? (map[statut] || statut) : '';
  }

  voirDetails(demande: Membre): void {
    this.selectedDemande = demande;
  }

  fermerModal(): void {
    this.selectedDemande = null;
  }

accepter(demande: Membre): void {
  if (!demande.id) return;
  this.membreService.activerMembre(demande.id).subscribe({
    next: (res: any) => {
      this.demandes = this.demandes.filter(d => d.id !== demande.id);
      this.activationLien = res?.activationLien ?? null;
      this.copied = false;
      if (this.activationLien) {
        this.toast.success("Membre accepté — copiez le lien d'activation ci-dessous");
      } else {
        this.toast.success("Membre accepté avec succès");
      }
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Erreur activation membre', err);
      this.toast.danger("Erreur lors de l'activation du membre");
    }
  });
}

copierLien(): void {
  if (!this.activationLien) return;
  navigator.clipboard?.writeText(this.activationLien).then(() => {
    this.copied = true;
    setTimeout(() => { this.copied = false; }, 2500);
  });
}

  refuser(demande: Membre): void {

    console.warn('Refus non encore implémenté côté backend');
  }
private bytesToBase64(bytes: any): string {
  try {
    
    if (typeof bytes === 'string') {
      return bytes;
    }

    if (typeof bytes === 'object' && !Array.isArray(bytes)) {
      const values = Object.values(bytes) as number[];
      const binary = values.map(b => String.fromCharCode(b)).join('');
      return window.btoa(binary);
    }

  
    if (Array.isArray(bytes)) {
      const binary = bytes.map(b => String.fromCharCode(b)).join('');
      return window.btoa(binary);
    }

    return '';
  } catch (e) {
    console.error('Erreur conversion image:', e);
    return '';
  }
}
}