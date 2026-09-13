import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MembreHeader } from '../membre-header/membre-header';
import { MembreMenu } from '../membre-menu/membre-menu';
import { EvenementService } from '../services/evenement-service';
import { Evenement, TypeEvenement } from '../model/evenement.model';
import { Image } from '../model/image.model';

@Component({
  selector: 'app-evenements',
  standalone: true,
  imports: [MembreHeader, MembreMenu, CommonModule, RouterModule],
  templateUrl: './evenements.html',
  styleUrl: './evenements.css',
})
export class Evenements implements OnInit {
  activeTab: 'avenir' | 'passes' = 'avenir';
  aVenir: Evenement[] = [];
  passes: Evenement[] = [];

  constructor(
    private evenementService: EvenementService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.evenementService.listeEvenements().subscribe(evenements => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      evenements.forEach(evt => {
       
        if (evt.image) {
          evt.imageStr = this.getImageUrl(evt.image);
        }

        const dateEvt = new Date(evt.date);
        dateEvt.setHours(0, 0, 0, 0);

        if (dateEvt >= today) {
          this.aVenir.push(evt);
        } else {
          this.passes.push(evt);
        }
      });

      this.cd.detectChanges();
    });
  }

  get activeEvents(): Evenement[] {
    return this.activeTab === 'avenir' ? this.aVenir : this.passes;
  }

  setTab(tab: 'avenir' | 'passes'): void {
    this.activeTab = tab;
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