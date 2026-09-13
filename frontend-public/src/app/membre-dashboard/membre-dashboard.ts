import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MembreHeader } from '../membre-header/membre-header';
import { MembreMenu } from '../membre-menu/membre-menu';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MembreService } from '../services/membre-service';
import { RecommandationService } from '../services/recommandation-service';
import { Evenement, TypeEvenement } from '../model/evenement.model';
import { Image } from '../model/image.model';

interface RecItem extends Evenement {
  explication?: string;
}

@Component({
  selector: 'app-membre-dashboard',
  standalone: true,
  imports: [MembreHeader, MembreMenu, RouterModule, CommonModule],
  templateUrl: './membre-dashboard.html',
  styleUrl: './membre-dashboard.css',
})
export class MembreDashboard implements OnInit {

  membre: any = null;
  initiales = '';
  moisActif = 0;
  dateExpiration: Date | null = null;
  cotisationValide = false;
  recommandations: RecItem[] = [];

  constructor(
    private membreService: MembreService,
    private recommandationService: RecommandationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.membre = this.membreService.getMembreFromToken();

    if (this.membre) {
      const n = this.membre.nom?.[0] ?? '';
      const p = this.membre.prenom?.[0] ?? '';
      this.initiales = (n + p).toUpperCase();

      if (this.membre.dateAdhesion) {
        const adhesion = new Date(this.membre.dateAdhesion + 'T00:00:00');
        const now = new Date();
        this.moisActif =
          (now.getFullYear() - adhesion.getFullYear()) * 12 +
          (now.getMonth() - adhesion.getMonth());
      }

      if (this.membre.dateExpiration) {
        const expiration = new Date(this.membre.dateExpiration + 'T00:00:00');
        this.cotisationValide = expiration > new Date();
        this.dateExpiration = expiration;
      }

      
      this.recommandationService.getRecommandations(this.membre.id).subscribe(recs => {
        console.log('Recommandations reçues:', recs);
        this.recommandations = recs.map(r => {
          const evt = r.evenement as RecItem;
          if (evt.image) evt.imageStr = this.getImageUrl(evt.image);
          evt.explication = r.explication;
          return evt;
        });
        this.cdr.detectChanges();
      });
    }

    this.cdr.detectChanges();
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