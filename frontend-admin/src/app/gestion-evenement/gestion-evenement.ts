import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { Header } from '../header/header';
import { Menu } from '../menu/menu';
import { FormsModule } from '@angular/forms';
import { Evenement, TypeEvenement } from '../model/evenement.model';
import { EvenementService } from '../services/evenement.service';
import { Image } from '../model/image.model';
import { NgToastService } from 'ng-angular-popup';

@Component({
  selector: 'app-gestion-evenement',
  standalone: true,
  imports: [Menu, Header, NgIf, FormsModule, CommonModule, NgForOf],
  templateUrl: './gestion-evenement.html',
  styleUrl: './gestion-evenement.css',
})
export class GestionEvenement implements OnInit {

  typeEvenementValues = Object.values(TypeEvenement);

  
  evenements: Evenement[] = [];

  
  isAddModalOpen = false;
  isEditMode = false;
  newEvent = new Evenement();
  uploadedImage!: File;
  imagePath: any;


  isDeleteModalOpen = false;
  eventToDelete: Evenement | null = null;

  constructor(
    private evenementService: EvenementService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private toast: NgToastService
  ) {}


  ngOnInit(): void {
    this.evenementService.listeEvenement().subscribe(events => {
      this.evenements = this.sortByDate(events);
      this.cdr.detectChanges();
    });
  }

  private sortByDate(list: Evenement[]): Evenement[] {
    return [...list].sort((a, b) =>
      new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()
    );
  }


  openAddModal(): void {
    this.isEditMode = false;
    this.newEvent = new Evenement();
    this.imagePath = null;
    this.uploadedImage = undefined as any;
    this.isAddModalOpen = true;
  }

  openEditModal(event: Evenement): void {
    this.isEditMode = true;
    this.newEvent = { ...event };   
    this.imagePath = null;
    this.uploadedImage = undefined as any;
    this.isAddModalOpen = true;
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
  }

  
  addEvent() {
    if (
      !this.newEvent.titre ||
      !this.newEvent.description ||
      !this.newEvent.date ||
      !this.newEvent.heure ||
      !this.newEvent.lieu ||
      !this.newEvent.type ||
      !this.uploadedImage
    ) {
      this.toast.info("Veuillez remplir tous les champs");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (this.newEvent.date < today) {
      this.toast.warning("La date doit être aujourd'hui ou future");
      return;
    }

    this.evenementService.uploadImage(this.uploadedImage, this.uploadedImage.name).subscribe({
      next: (img: Image) => {
        this.newEvent.image = img;
        this.newEvent.imageId = img.idImage;
        this.evenementService.ajouterEvenement(this.newEvent).subscribe({
          next: (event) => {
            this.evenements = this.sortByDate([...this.evenements, event]);
            this.toast.success("Événement ajouté avec succès");
            this.newEvent = new Evenement();
            this.uploadedImage = undefined as any;
            this.imagePath = null;
            this.closeAddModal();
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error(err);
            this.toast.danger("Erreur lors de l'ajout");
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.toast.danger("Erreur upload image");
      }
    });
  }


  updateEvent() {
    if (
      !this.newEvent.titre ||
      !this.newEvent.description ||
      !this.newEvent.date ||
      !this.newEvent.heure ||
      !this.newEvent.lieu ||
      !this.newEvent.type
    ) {
      this.toast.info("Veuillez remplir tous les champs");
      return;
    }

    const doUpdate = (eventToSave: Evenement) => {
      this.evenementService.updateEvenement(eventToSave).subscribe({
        next: (updated) => {
          const index = this.evenements.findIndex(e => e.id === updated.id);
          if (index !== -1) {
            this.evenements[index] = updated;
            this.evenements = this.sortByDate(this.evenements);
          }
          this.toast.success("Événement modifié avec succès");
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
      this.evenementService.uploadImage(this.uploadedImage, this.uploadedImage.name).subscribe({
        next: (img: Image) => {
          this.newEvent.image = img;
          this.newEvent.imageId = img.idImage;
          doUpdate(this.newEvent);
        },
        error: (err) => {
          console.error(err);
          this.toast.danger("Erreur upload image");
        }
      });
    } else {
     
      doUpdate(this.newEvent);
    }
  }

  supprimerEvenement(event: Evenement) {
    this.eventToDelete = event;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.eventToDelete = null;
  }

  confirmDelete() {
    if (!this.eventToDelete) return;
    const event = this.eventToDelete;

    this.evenementService.deleteEvenement(event).subscribe({
      next: () => {
        if (event.image?.idImage) {
          this.evenementService.deleteImage(event.image.idImage).subscribe({
            next: () => console.log("Image supprimée"),
            error: (err) => console.error("Erreur suppression image", err)
          });
        }
        const index = this.evenements.findIndex(e => e.id === event.id);
        if (index !== -1) {
          this.evenements.splice(index, 1);
          this.evenements = [...this.evenements];
        }
        this.closeDeleteModal();
        this.toast.success("Événement supprimé avec succès");
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.toast.danger("Erreur lors de la suppression");
        this.closeDeleteModal();
      }
    });
  }

 
  getStatut(e: Evenement): 'upcoming' | 'ongoing' | 'finished' {
    if (!e.date) return 'upcoming';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(e.date); d.setHours(0, 0, 0, 0);
    if (d > today) return 'upcoming';
    if (d.getTime() === today.getTime()) return 'ongoing';
    return 'finished';
  }

  getStatutLabel(e: Evenement): string {
    const s = this.getStatut(e);
    if (s === 'upcoming') return 'À venir';
    if (s === 'ongoing')  return 'En cours';
    return 'Terminé';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.newEvent.image = file;
  }

  onImageUpload(event: any) {
    this.uploadedImage = event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(this.uploadedImage);
    reader.onload = () => {
      this.zone.run(() => {
        this.imagePath = reader.result;
        this.cdr.detectChanges();
      });
    };
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