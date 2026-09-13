import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MembreHeader } from '../membre-header/membre-header';
import { MembreMenu } from '../membre-menu/membre-menu';
import { AvisService } from '../services/avis-service';
import { MembreService } from '../services/membre-service';
import { EvenementService } from '../services/evenement-service';
import { Avis } from '../model/avis.model';

@Component({
  selector: 'app-mes-avis',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MembreHeader, MembreMenu],
  templateUrl: './mes-avis.html',
  styleUrl: './mes-avis.css',
})
export class MesAvis implements OnInit {

  avisList: Avis[] = [];
  editingId: number | null = null;
  editingContenu = '';
  suppressionId: number | null = null;

  constructor(
    private avisService: AvisService,
    private membreService: MembreService,
    private evenementService: EvenementService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const membreId = this.membreService.getMembreId();
    if (!membreId) return;

    forkJoin({
      avisList:   this.avisService.getAvisByMembre(membreId),
      evenements: this.evenementService.listeEvenements(),
    }).subscribe({
      next: ({ avisList, evenements }) => {
        const eventMap = new Map(evenements.map(e => [e.id, e]));
        this.avisList = avisList.map(a => ({
          ...a,
          evenement: a.evenement?.id ? eventMap.get(a.evenement.id) as any : a.evenement,
        }));
        this.cd.detectChanges();
      },
    });
  }

 

  startEdit(avis: Avis): void {
    this.editingId      = avis.id!;
    this.editingContenu = avis.contenu;
  }

  cancelEdit(): void {
    this.editingId      = null;
    this.editingContenu = '';
  }

  saveEdit(avis: Avis): void {
    if (!this.editingContenu.trim()) return;

    this.avisService.modifierAvis(avis.id!, this.editingContenu.trim()).subscribe({
      next: () => {
        avis.contenu    = this.editingContenu.trim();
        this.editingId  = null;
        this.cd.detectChanges();
      },
      error: (err) => {
        if (err.status === 500) {
          avis.contenu   = this.editingContenu.trim();
          this.editingId = null;
          this.cd.detectChanges();
        }
      },
    });
  }

  // ── Suppression ──────────────────────────────────────────────────────────────

  confirmSupprimer(id: number): void {
    this.suppressionId = id;
  }

  cancelSupprimer(): void {
    this.suppressionId = null;
  }

  supprimer(id: number): void {
    this.avisService.supprimerAvis(id).subscribe({
      next: () => {
        this.avisList      = this.avisList.filter(a => a.id !== id);
        this.suppressionId = null;
        this.cd.detectChanges();
      },
    });
  }

  

  getImageUrl(img: any): string {
    if (!img?.image) return '';
    if (typeof img.image === 'string') return `data:${img.type};base64,${img.image}`;
    try {
      const bytes  = new Uint8Array(img.image);
      let binary   = '';
      bytes.forEach(b => (binary += String.fromCharCode(b)));
      return `data:${img.type};base64,${btoa(binary)}`;
    } catch { return ''; }
  }
}
