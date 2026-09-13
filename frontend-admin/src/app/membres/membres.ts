import { ChangeDetectorRef, Component, HostListener, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Menu } from '../menu/menu';
import { Header } from '../header/header';
import { MembreService } from '../services/membre.service';
import { Membre, StatutType } from '../model/Membre.model';

@Component({
  selector: 'app-membres',
  standalone: true,
  imports: [Menu, Header, CommonModule, FormsModule],
  templateUrl: './membres.html',
  styleUrl: './membres.css',
})
export class Membres implements OnInit {
  allMembres: Membre[] = [];
  filteredMembres: Membre[] = [];
  isLoading = true;

  searchQuery = '';
  selectedStatut = '';
  selectedCategorie = '';

  statutDropdownOpen = false;
  categorieDropdownOpen = false;

  showAjouterModal = false;
  isSaving = false;
  nouveauMembre: Membre = new Membre();
  centreInput = '';
  activationLien: string | null = null;
  copied = false;

  statutOptions = [
    { value: '',       label: 'Tous les statuts' },
    { value: 'ACTIF',  label: 'Actif' },
    { value: 'EXPIRE', label: 'Expiré' },
  ];

  categorieOptions = [
    { value: '',             label: 'Toutes catégories' },
    { value: 'ETUDIANT',     label: 'Étudiant' },
    { value: 'PROFESSIONNEL',label: 'Professionnel' },
    { value: 'ENSEIGNANT',   label: 'Enseignant' },
    { value: 'CHERCHEUR',    label: 'Chercheur' },
  ];

  get formCategorieOptions(): { value: string; label: string }[] {
    return this.categorieOptions.filter(c => c.value !== '');
  }

  constructor(private membreService: MembreService, private cdr: ChangeDetectorRef, private zone: NgZone) {}

  ngOnInit(): void {
    forkJoin({
      actifs:  this.membreService.getMembresActifs().pipe(catchError(() => of([] as Membre[]))),
      expires: this.membreService.getMembresExpires().pipe(catchError(() => of([] as Membre[]))),
    }).subscribe({
      next: ({ actifs, expires }) => {
        this.zone.run(() => {
          this.allMembres = [...actifs, ...expires].sort((a, b) =>
            new Date(b.dateAdhesion ?? 0).getTime() - new Date(a.dateAdhesion ?? 0).getTime()
          );
          this.applyFilters();
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: err => {
        console.error('Erreur chargement membres', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  @HostListener('document:click')
  closeDropdowns(): void {
    this.statutDropdownOpen = false;
    this.categorieDropdownOpen = false;
  }

  toggleStatutDropdown(event: Event): void {
    event.stopPropagation();
    this.statutDropdownOpen = !this.statutDropdownOpen;
    this.categorieDropdownOpen = false;
  }

  toggleCategorieDropdown(event: Event): void {
    event.stopPropagation();
    this.categorieDropdownOpen = !this.categorieDropdownOpen;
    this.statutDropdownOpen = false;
  }

  selectStatut(value: string, event: Event): void {
    event.stopPropagation();
    this.selectedStatut = value;
    this.statutDropdownOpen = false;
    this.applyFilters();
  }

  selectCategorie(value: string, event: Event): void {
    event.stopPropagation();
    this.selectedCategorie = value;
    this.categorieDropdownOpen = false;
    this.applyFilters();
  }

  getStatutLabel(): string {
    return this.statutOptions.find(o => o.value === this.selectedStatut)?.label ?? 'Tous les statuts';
  }

  getCategorieFilterLabel(): string {
    return this.categorieOptions.find(o => o.value === this.selectedCategorie)?.label ?? 'Toutes catégories';
  }

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredMembres = this.allMembres.filter(m => {
      const matchSearch = !q || [m.nom, m.prenom, m.email, m.referenceMembre]
        .some(v => v?.toLowerCase().includes(q));
      const matchStatut = !this.selectedStatut || m.statutMembre === this.selectedStatut;
      const matchCat    = !this.selectedCategorie || m.statut === this.selectedCategorie;
      return matchSearch && matchStatut && matchCat;
    });
  }

  getInitiales(nom?: string, prenom?: string): string {
    return ((nom?.[0] ?? '') + (prenom?.[0] ?? '')).toUpperCase();
  }

  formatDateOnly(dateStr?: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }

  getCategorieLabel(statut?: StatutType): string {
    const labels: Record<string, string> = {
      ETUDIANT:      'Étudiant',
      PROFESSIONNEL: 'Professionnel',
      ENSEIGNANT:    'Enseignant',
      CHERCHEUR:     'Chercheur',
    };
    return statut ? (labels[statut] ?? statut) : '—';
  }

  openAjouterModal(): void {
    this.nouveauMembre = new Membre();
    this.nouveauMembre.centresInteret = [];
    this.nouveauMembre.statut = StatutType.ETUDIANT;
    this.centreInput = '';
    this.showAjouterModal = true;
  }

  closeAjouterModal(): void {
    if (this.isSaving) return;
    this.showAjouterModal = false;
  }

  ajouterCentre(event: Event): void {
    event.preventDefault();
    const value = this.centreInput.trim();
    if (!value) return;
    if (!this.nouveauMembre.centresInteret!.includes(value)) {
      this.nouveauMembre.centresInteret!.push(value);
    }
    this.centreInput = '';
  }

  retirerCentre(tag: string): void {
    this.nouveauMembre.centresInteret =
      this.nouveauMembre.centresInteret!.filter(t => t !== tag);
  }

  submitAjouterMembre(): void {
    if (this.isSaving) return;
    this.isSaving = true;

    const payload: any = {
      nom: this.nouveauMembre.nom,
      prenom: this.nouveauMembre.prenom,
      email: this.nouveauMembre.email,
      telephone: this.nouveauMembre.telephone,
      dateNaissance: this.nouveauMembre.dateNaissance || null,
      statut: this.nouveauMembre.statut,
      cinNumero: this.nouveauMembre.cinNumero,
      consentement: 1,
      statutMembre: 'ACTIF',
      centresInteret: this.nouveauMembre.centresInteret ?? [],
    };

    this.membreService.ajouterMembre(payload).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        this.showAjouterModal = false;
        this.reloadMembres();
      },
      error: (err) => {
        console.error('Erreur ajout membre', err);
        this.isSaving = false;
        this.cdr.detectChanges();
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

  fermerModalAjout(): void {
    this.showAjouterModal = false;
    this.activationLien = null;
  }

  supprimerMembre(m: Membre): void {
    const nom = `${m.nom} ${m.prenom}`;
    if (!m.id) return;
    if (!confirm(`Supprimer définitivement le membre "${nom}" ?\nCette action est irréversible.`)) return;
    this.membreService.supprimerMembre(m.id).subscribe({
      next: () => {
        this.reloadMembres();
      },
      error: (err) => {
        console.error('Erreur suppression membre', err);
        alert('Impossible de supprimer ce membre.');
      }
    });
  }

  private reloadMembres(): void {
    this.isLoading = true;
    forkJoin({
      actifs:  this.membreService.getMembresActifs().pipe(catchError(() => of([] as Membre[]))),
      expires: this.membreService.getMembresExpires().pipe(catchError(() => of([] as Membre[]))),
    }).subscribe({
      next: ({ actifs, expires }) => {
        this.zone.run(() => {
          this.allMembres = [...actifs, ...expires].sort((a, b) =>
            new Date(b.dateAdhesion ?? 0).getTime() - new Date(a.dateAdhesion ?? 0).getTime()
          );
          this.applyFilters();
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: err => {
        console.error('Erreur rechargement membres', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
