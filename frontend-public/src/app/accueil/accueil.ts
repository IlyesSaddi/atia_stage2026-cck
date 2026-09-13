import { ChangeDetectorRef, Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdhesionModalService } from '../adhesion-modal/adhesion-modal.service';
import { Footer } from '../footer/footer';
import { Header } from '../header/header';
import { CommonModule } from '@angular/common';
import { Chatbot } from '../chatbot/chatbot';
import { AdministratifService } from '../services/administratif-service';
import { Administratif } from '../model/administratif.model';
import { PartenaireService } from '../services/partenaire-service';
import { Partenaire } from '../model/partenaire.model';
import { AvisService } from '../services/avis-service';
import { EvenementService } from '../services/evenement-service';
import { Evenement } from '../model/evenement.model';
import { Image } from '../model/image.model';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [Header, Footer, RouterLink, CommonModule, Chatbot],
  templateUrl: './accueil.html',
  styleUrl: './accueil.css',
})
export class Accueil implements OnInit {
  protected chatOpen = false;
  private readonly adhesionModal = inject(AdhesionModalService);
  private readonly administratifService = inject(AdministratifService);
  private readonly partenaireService = inject(PartenaireService);
  private readonly avisService = inject(AvisService);
  private readonly evenementService = inject(EvenementService);
  protected readonly playIntroAnimation = signal(false);

  administratifs: Administratif[] = [];
  partenaires: Partenaire[] = [];
  partenairesTrack: Partenaire[] = [];
  topAvis: any[] = [];
  upcomingEvents: Evenement[] = [];
  pastEvents: Evenement[] = [];
  selectedEvent: Evenement | null = null;
allEvents: Evenement[] = [];
  @HostListener('document:keydown.escape')
  closeModal() { this.selectedEvent = null; }

  openModal(evt: Evenement) { this.selectedEvent = evt; }

  getEventStatus(evt: Evenement): string {
    const d = new Date(evt.date); d.setHours(0,0,0,0);
    const t = new Date(); t.setHours(0,0,0,0);
    return d >= t ? 'À VENIR' : 'ÉDITION PASSÉE';
  }

  private readonly statutLabels: Record<string, string> = {
    etudiant:      'Étudiant',
    professionnel: 'Professionnel',
    chercheur:     'Chercheur',
    enseignant:    'Enseignant',
  };

  getInitials(nomComplet: string): string {
    const parts = (nomComplet ?? '').trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.charAt(0) ?? '';
    const b = parts[1]?.charAt(0) ?? '';
    return (a + b).toUpperCase();
  }

  formatStatut(statut: string): string {
    return this.statutLabels[statut?.toLowerCase()] ?? 'Membre';
  }

  constructor(private cd: ChangeDetectorRef) {
    const introKey = 'atia-accueil-intro-seen-session-v2';
    try {
      if (!sessionStorage.getItem(introKey)) {
        this.playIntroAnimation.set(true);
        sessionStorage.setItem(introKey, '1');
      }
    } catch {
      this.playIntroAnimation.set(true);
    }
  }

  ngOnInit(): void {
    requestAnimationFrame(() => {
      this.playIntroAnimation.set(true);
    });

    this.administratifService.listeAdministratifs().pipe(
      catchError(() => of([] as Administratif[]))
    ).subscribe(admins => {
      admins.forEach(admin => {
        if (admin.image) admin.imageStr = this.getImageUrl(admin.image);
      });
      this.administratifs = admins;
      this.cd.detectChanges();
    });

    this.partenaireService.listePartenaires().pipe(
      catchError(() => of([] as Partenaire[]))
    ).subscribe(partenaires => {
      partenaires.forEach(p => {
        if (p.image) p.imageStr = this.getImageUrl(p.image);
      });
      this.partenaires = partenaires;

      this.partenairesTrack = [...partenaires, ...partenaires, ...partenaires, ...partenaires];
      this.cd.detectChanges();
    });

    this.avisService.getTopAvis().pipe(
      catchError(() => of([]))
    ).subscribe(avis => {
      this.topAvis = avis;
      this.cd.detectChanges();
    });

    this.evenementService.listeEvenements().pipe(
      catchError(() => of([] as Evenement[]))
    ).subscribe(evts => {

  evts.forEach(e => {
    if (e.image) {
      e.imageStr = this.getImageUrl(e.image);
    }
  });

  this.allEvents = evts;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  this.upcomingEvents = evts
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);
  this.pastEvents = evts
  .filter(e => new Date(e.date) < today)
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 3);

  this.cd.detectChanges();
});
  }

  getImageUrl(img: Image): string {
    if (!img?.image) return '';
    if (typeof img.image === 'string') {
      return `data:${img.type};base64,${img.image}`;
    }
    try {
      const bytes = new Uint8Array(img.image);
      let binary = '';
      bytes.forEach(b => (binary += String.fromCharCode(b)));
      return `data:${img.type};base64,${btoa(binary)}`;
    } catch {
      return '';
    }
  }

  openDemandeAdhesion(): void {
    this.adhesionModal.open();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-TN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  avatarUrl(name: string): string {
    const initials = name.trim().split(/\s+/).map(w => w[0] ?? '').slice(0, 2).join('').toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112"><circle cx="56" cy="56" r="56" fill="#1e3a5f"/><text x="56" y="72" font-family="Arial,sans-serif" font-size="36" fill="#ffffff" text-anchor="middle" font-weight="bold">${initials}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
}
