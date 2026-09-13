import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { Header } from '../header/header';
import { Menu } from '../menu/menu';
import { Partenaire, TypePartenaire } from '../model/partneraire.model';
import { PartenaireService } from '../services/partenaire.service';
import { Image } from '../model/image.model';
import { FormsModule } from '@angular/forms';
import { NgToastService } from 'ng-angular-popup';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-liste-partner',
  standalone: true,
  imports: [Menu, Header, NgIf, FormsModule, CommonModule, NgForOf],
  templateUrl: './liste-partner.html',
  styleUrl: './liste-partner.css',
})
export class ListePartner implements OnInit {

 
  partenaires: Partenaire[] = [];
  filteredPartenaires: Partenaire[] = [];

  searchTerm: string = '';
  selectedType: string = '';
  private searchSubject = new Subject<string>();

  isAddModalOpen = false;
  isEditMode = false;
  newPartner = new Partenaire();
  uploadedImage!: File;
  imagePath: any;


  isDeleteModalOpen = false;
  partenaireToDelete: Partenaire | null = null;


  typeDropdownOpen = false;

  typeFilterOptions = [
    { value: '',                        label: 'Tous les types' },
    { value: TypePartenaire.ACADEMIQUE,  label: 'Académique'  },
    { value: TypePartenaire.ENTREPRISE,  label: 'Entreprise'  },
    { value: TypePartenaire.INSTITUTION, label: 'Institution' },
    { value: TypePartenaire.ONG,         label: 'ONG'         },
  ];

  typeOptions = [
    { value: TypePartenaire.ACADEMIQUE,  label: 'Académique'  },
    { value: TypePartenaire.ENTREPRISE,  label: 'Entreprise'  },
    { value: TypePartenaire.INSTITUTION, label: 'Institution' },
    { value: TypePartenaire.ONG,         label: 'ONG'         },
  ];

  constructor(
    private partenaireService: PartenaireService,
    private cdr: ChangeDetectorRef,
    private toast: NgToastService
  ) {}

 
  @HostListener('document:click')
  closeDropdowns(): void { this.typeDropdownOpen = false; }

  toggleTypeDropdown(event: Event): void {
    event.stopPropagation();
    this.typeDropdownOpen = !this.typeDropdownOpen;
  }

  selectType(value: string, event: Event): void {
    event.stopPropagation();
    this.typeDropdownOpen = false;
    this.onTypeChange(value);
    this.cdr.detectChanges();
  }

  getTypeFilterLabel(): string {
    return this.typeFilterOptions.find(o => o.value === this.selectedType)?.label ?? 'Tous les types';
  }

  
  ngOnInit(): void {
    this.loadPartenaires();

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(term => {
      if (term.trim().length === 0) {
        this.applyFilters();
      } else if (this.selectedType) {
        this.applyFilters();
      } else {
        this.partenaireService.searchByNom(term.trim()).subscribe({
          next: (data) => {
            this.filteredPartenaires = data;
            this.cdr.detectChanges();
          },
          error: () => this.toast.danger("Erreur lors de la recherche")
        });
      }
    });
  }

  
  loadPartenaires(): void {
    this.partenaireService.listePartenaires().subscribe({
      next: (data) => {
        const sorted = [...data].sort((a, b) =>
          new Date(b.datePartenariat ?? 0).getTime() - new Date(a.datePartenariat ?? 0).getTime()
        );
        this.partenaires = sorted;
        this.filteredPartenaires = sorted;
        this.cdr.detectChanges();
      },
      error: () => this.toast.danger("Erreur lors du chargement des partenaires")
    });
  }

  // ══════════════════════════════════════════════════════
  // MODAL AJOUTER / MODIFIER — ouverture & fermeture
  // ══════════════════════════════════════════════════════
  openAddModal(): void {
    this.isEditMode = false;
    this.newPartner = new Partenaire();
    this.imagePath = null;
    this.uploadedImage = undefined as any;
    this.isAddModalOpen = true;
  }

  openEditModal(partenaire: Partenaire): void {
    this.isEditMode = true;
    this.newPartner = { ...partenaire };  
    this.imagePath = null;
    this.uploadedImage = undefined as any;
    this.isAddModalOpen = true;
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
  }

  addPartner(): void {
    const urlPattern   = /^(https?:\/\/)?([\w\d-]+\.)+\w{2,}(\/.*)?$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[+]?[\d\s\-().]{8,20}$/;

    if (
      !this.newPartner.nom          ||
      !this.newPartner.description  ||
      !this.newPartner.type         ||
      !this.newPartner.siteweb      ||
      !this.newPartner.email        ||
      !this.newPartner.datePartenariat ||
      !this.uploadedImage
    ) {
      this.toast.info("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (!urlPattern.test(this.newPartner.siteweb)) {
      this.toast.warning("Lien site web invalide");
      return;
    }

    if (!emailPattern.test(this.newPartner.email)) {
      this.toast.warning("Adresse email invalide");
      return;
    }

    if (this.newPartner.telephone && !phonePattern.test(this.newPartner.telephone)) {
      this.toast.warning("Numéro de téléphone invalide");
      return;
    }

    this.partenaireService.uploadImage(this.uploadedImage, this.uploadedImage.name).subscribe({
      next: (img: Image) => {
        this.newPartner.image = img;
        this.newPartner.imageId = img.idImage;
        this.partenaireService.ajouterPartenaire(this.newPartner).subscribe({
          next: (partner) => {
            this.partenaires = [...this.partenaires, partner];
            this.applyFilters();
            this.toast.success("Partenaire ajouté avec succès");
            this.newPartner = new Partenaire();
            this.uploadedImage = undefined as any;
            this.imagePath = null;
            this.closeAddModal();
            this.cdr.detectChanges();
          },
          error: (err) => { console.error(err); this.toast.danger("Erreur lors de l'ajout"); }
        });
      },
      error: (err) => { console.error(err); this.toast.danger("Erreur upload image"); }
    });
  }


  updatePartner(): void {
    const urlPattern   = /^(https?:\/\/)?([\w\d-]+\.)+\w{2,}(\/.*)?$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[+]?[\d\s\-().]{8,20}$/;

    if (
      !this.newPartner.nom          ||
      !this.newPartner.description  ||
      !this.newPartner.type         ||
      !this.newPartner.siteweb      ||
      !this.newPartner.email        ||
      !this.newPartner.datePartenariat
    ) {
      this.toast.info("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (!urlPattern.test(this.newPartner.siteweb)) {
      this.toast.warning("Lien site web invalide");
      return;
    }

    if (!emailPattern.test(this.newPartner.email)) {
      this.toast.warning("Adresse email invalide");
      return;
    }

    if (this.newPartner.telephone && !phonePattern.test(this.newPartner.telephone)) {
      this.toast.warning("Numéro de téléphone invalide");
      return;
    }

    const doUpdate = (partnerToSave: Partenaire) => {
      this.partenaireService.updatePartenaire(partnerToSave).subscribe({
        next: (updated) => {
          const index = this.partenaires.findIndex(p => p.id === updated.id);
          if (index !== -1) {
            this.partenaires[index] = updated;
            this.partenaires = [...this.partenaires];
          }
          this.applyFilters();
          this.toast.success("Partenaire modifié avec succès");
          this.closeAddModal();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.toast.danger("Erreur lors de la modification");
        }
      });
    };

    
    if (this.uploadedImage) {
      this.partenaireService.uploadImage(this.uploadedImage, this.uploadedImage.name).subscribe({
        next: (img: Image) => {
          this.newPartner.image = img;
          this.newPartner.imageId = img.idImage;
          doUpdate(this.newPartner);
        },
        error: (err) => {
          console.error(err);
          this.toast.danger("Erreur upload image");
        }
      });
    } else {
      
      doUpdate(this.newPartner);
    }
  }

  deletePartner(partenaire: Partenaire): void {
    this.partenaireToDelete = partenaire;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.partenaireToDelete = null;
  }

  confirmDelete(): void {
    if (!this.partenaireToDelete) return;
    const partenaire = this.partenaireToDelete;

    this.partenaireService.deletePartenaire(partenaire).subscribe({
      next: () => {
        if (partenaire.image?.idImage) {
          this.partenaireService.deleteImage(partenaire.image.idImage).subscribe({
            next: () => console.log("Image supprimée"),
            error: (err) => console.error("Erreur suppression image", err)
          });
        }
        this.partenaires = this.partenaires.filter(p => p !== partenaire);
        this.applyFilters();
        this.closeDeleteModal();
        this.toast.success("Partenaire supprimé avec succès");
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.toast.danger("Erreur lors de la suppression");
        this.closeDeleteModal();
      }
    });
  }

 
  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.searchSubject.next(term);
  }

  onTypeChange(type: string): void {
    this.selectedType = type;

    if (!type) {
      if (this.searchTerm.trim()) {
        this.searchSubject.next(this.searchTerm);
      } else {
        this.filteredPartenaires = [...this.partenaires];
        this.cdr.detectChanges();
      }
      return;
    }

    if (this.searchTerm.trim()) {
      this.applyFilters();
    } else {
      this.partenaireService.searchByType(type as TypePartenaire).subscribe({
        next: (data) => {
          this.filteredPartenaires = data;
          this.cdr.detectChanges();
        },
        error: () => this.toast.danger("Erreur lors du filtre par type")
      });
    }
  }

  private applyFilters(): void {
    let result = [...this.partenaires];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(p =>
        p.nom?.toLowerCase().includes(term) ||
        p.email?.toLowerCase().includes(term)
      );
    }

    if (this.selectedType) {
      result = result.filter(p => p.type === this.selectedType);
    }

    this.filteredPartenaires = result;
    this.cdr.detectChanges();
  }

 
  onImageUpload(event: any): void {
    this.uploadedImage = event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(this.uploadedImage);
    reader.onload = () => { this.imagePath = reader.result; };
  }

  onFileSelected(event: any): void {
    this.newPartner.image = event.target.files[0];
  }

  getImageUrl(img: Image): string {
    if (!img?.image) return '';

    if (typeof img.image === 'string') {
      return `data:${img.type};base64,${img.image}`;
    }

    try {
      const bytes = new Uint8Array(img.image);
      let binary = '';
      bytes.forEach(b => binary += String.fromCharCode(b));
      const base64 = btoa(binary);
      return `data:${img.type};base64,${base64}`;
    } catch (e) {
      console.error('Erreur conversion image:', e);
      return '';
    }
  }
}