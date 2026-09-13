import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MembreHeader } from '../membre-header/membre-header';
import { MembreMenu } from '../membre-menu/membre-menu';
import { EvenementService } from '../services/evenement-service';
import { AvisService } from '../services/avis-service';
import { MembreService } from '../services/membre-service';
import { Evenement, TypeEvenement } from '../model/evenement.model';
import { Avis } from '../model/avis.model';
import { Image } from '../model/image.model';

@Component({
  selector: 'app-evenements-details',
  standalone: true,
  imports: [MembreHeader, MembreMenu, CommonModule, RouterModule, FormsModule],
  templateUrl: './evenements-details.html',
  styleUrl: './evenements-details.css',
})
export class EvenementsDetails implements OnInit {
  evenement: Evenement | null = null;
  isPasse = false;

  avisList: Avis[] = [];
  nouveauAvis = '';
  envoiEnCours = false;
  showMerciModal = false;
  membreId: number | null = null;

  get dejaAvis(): boolean {
    return this.avisList.some(a => a.membre?.id === this.membreId);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evenementService: EvenementService,
    private avisService: AvisService,
    private membreService: MembreService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.membreId = this.membreService.getMembreId();
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.evenementService.listeEvenements().subscribe(evenements => {
      const evt = evenements.find(e => e.id === id);
      if (!evt) {
        this.router.navigate(['/evenements']);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateEvt = new Date(evt.date);
      dateEvt.setHours(0, 0, 0, 0);
      this.isPasse = dateEvt < today;

      this.evenement = evt;

      if (this.isPasse) {
        this.chargerAvis(id);
      }

      this.cd.detectChanges();
    });
  }

  chargerAvis(evenementId: number): void {
    this.avisService.getAvisByEvenement(evenementId).subscribe({
      next: (list) => {
        this.avisList = list;
        this.cd.detectChanges();
      },
    });
  }

  soumettreAvis(): void {
    if (!this.nouveauAvis.trim() || !this.membreId || !this.evenement?.id) return;

    this.envoiEnCours = true;
    const evenementId = this.evenement.id!;

    this.avisService.ajouterAvis(this.nouveauAvis.trim(), this.membreId, evenementId).subscribe({
      next: () => {
        this.nouveauAvis = '';
        this.envoiEnCours = false;
        this.showMerciModal = true;
        this.chargerAvis(evenementId);
        this.cd.detectChanges();
      },
      error: (err) => {
        // 500 = avis sauvegardé mais sérialisation de la réponse échoue côté backend
        if (err.status === 500 || err.status === 0) {
          this.nouveauAvis = '';
          this.envoiEnCours = false;
          this.showMerciModal = true;
          this.chargerAvis(evenementId);
        } else {
          this.envoiEnCours = false;
        }
        this.cd.detectChanges();
      },
    });
  }

  getBadgeColor(type: TypeEvenement): string {
    const colors: Record<TypeEvenement, string> = {
      [TypeEvenement.WORKSHOP]: '#d97706',
      [TypeEvenement.CONFERENCE]: '#2563eb',
      [TypeEvenement.HACKATHON]: '#7c3aed',
      [TypeEvenement.MEETUP]: '#059669',
      [TypeEvenement.FORMATION]: '#dc2626',
    };
    return colors[type] ?? '#6b7280';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-TN', {
      day: 'numeric', month: 'long', year: 'numeric'
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
}