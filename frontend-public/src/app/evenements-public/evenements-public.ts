import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EvenementService } from '../services/evenement-service';
import { AvisService } from '../services/avis-service';
import { Evenement } from '../model/evenement.model';
import { Avis } from '../model/avis.model';
import { Image } from '../model/image.model';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-evenements-public',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './evenements-public.html',
  styleUrl: './evenements-public.css',
})
export class EvenementsPublic implements OnInit {
  aVenir: Evenement[] = [];
  passes: Evenement[] = [];
  selectedEvent: Evenement | null = null;
  modalAvis: Avis[] = [];

  @HostListener('document:keydown.escape')
  closeModal() { this.selectedEvent = null; this.modalAvis = []; }

  openModal(evt: Evenement) {
    this.selectedEvent = evt;
    this.modalAvis = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(evt.date); d.setHours(0, 0, 0, 0);
    if (d < today && evt.id) {
      this.avisService.getAvisByEvenement(evt.id).pipe(
        catchError(() => of([] as Avis[]))
      ).subscribe((avis: Avis[]) => {
        this.modalAvis = avis;
        this.cd.detectChanges();
      });
    }
  }

  getInitials(membre?: { nom?: string; prenom?: string }): string {
    const a = membre?.prenom?.charAt(0) ?? '';
    const b = membre?.nom?.charAt(0) ?? '';
    return (a + b).toUpperCase() || '?';
  }

  getMemberName(membre?: { nom?: string; prenom?: string }): string {
    return [membre?.prenom, membre?.nom].filter(Boolean).join(' ') || 'Membre';
  }

  getEventStatus(evt: Evenement): string {
    const d = new Date(evt.date); d.setHours(0,0,0,0);
    const t = new Date(); t.setHours(0,0,0,0);
    return d >= t ? 'À VENIR' : 'ÉDITION PASSÉE';
  }

  getImageUrl(img: Image): string {
    if (!img?.image) return '';
    if (typeof img.image === 'string') return `data:${img.type};base64,${img.image}`;
    try {
      const bytes = new Uint8Array(img.image);
      let b = '';
      bytes.forEach(x => (b += String.fromCharCode(x)));
      return `data:${img.type};base64,${btoa(b)}`;
    } catch { return ''; }
  }

  constructor(
    private evenementService: EvenementService,
    private avisService: AvisService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.evenementService.listeEvenements().pipe(
      catchError(() => of([] as Evenement[]))
    ).subscribe(evenements => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      evenements.forEach(evt => {
        if (evt.image) evt.imageStr = this.getImageUrl(evt.image);
        const d = new Date(evt.date);
        d.setHours(0, 0, 0, 0);
        if (d >= today) {
          this.aVenir.push(evt);
        } else {
          this.passes.push(evt);
        }
      });

      this.aVenir.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      this.passes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      this.cd.detectChanges();
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-TN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }
}
