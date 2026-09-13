import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { Header } from '../header/header';
import { Menu } from '../menu/menu';
import { Administratif } from '../model/administratif.model';
import { AdministratifService } from '../services/administratif.service';
import { Image } from '../model/image.model';
import { FormsModule } from '@angular/forms';
import { NgToastService } from 'ng-angular-popup';

@Component({
  selector: 'app-bureau-executif',
  imports: [Menu, Header, NgIf, FormsModule, CommonModule, NgForOf],
  templateUrl: './bureau-executif.html',
  styleUrl: './bureau-executif.css',
})
export class BureauExecutif implements OnInit {

  
  administratifs: Administratif[] = [];

  
  isAddModalOpen = false;
  isEditMode = false;
  newAdministratif = new Administratif();
  uploadedImage!: File;
  imagePath: any;

  
  isDeleteModalOpen = false;
  adminToDelete: Administratif | null = null;

  constructor(
    private administratifService: AdministratifService,
    private cdr: ChangeDetectorRef,
    private toast: NgToastService
  ) {}

  
  ngOnInit(): void {
      this.administratifService.listeAdministratifs().subscribe(administratifs => {
      this.administratifs = administratifs;
      this.cdr.detectChanges();
    });
  }

  // ══════════════════════════════════════════════════════
  // MODAL AJOUTER / MODIFIER
  // ══════════════════════════════════════════════════════
  openAddModal(): void {
    this.isEditMode = false;
    this.newAdministratif = new Administratif();
    this.imagePath = null;
    this.uploadedImage = undefined as any;
    this.isAddModalOpen = true;
  }

  openEditModal(admin: Administratif): void {
    this.isEditMode = true;
    this.newAdministratif = { ...admin };
    this.imagePath = null;
    this.uploadedImage = undefined as any;
    this.isAddModalOpen = true;
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
  }

  
  addAdministratif() {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[0-9]{8}$/;

    if (
      !this.newAdministratif.nom ||
      !this.newAdministratif.prenom ||
      !this.newAdministratif.email ||
      !this.newAdministratif.tlf ||
      !this.newAdministratif.fonction ||
      !this.uploadedImage
    ) {
      this.toast.info("Veuillez remplir tous les champs");
      return;
    }
    if (!emailPattern.test(this.newAdministratif.email)) {
      this.toast.warning("Email invalide");
      return;
    }
    if (!phonePattern.test(this.newAdministratif.tlf)) {
      this.toast.warning("Numéro invalide (8 chiffres)");
      return;
    }

    this.administratifService.uploadImage(this.uploadedImage, this.uploadedImage.name).subscribe({
      next: (img: Image) => {
        this.newAdministratif.image = img;
        this.newAdministratif.imageId = img.idImage;
        this.administratifService.ajouterAdministratif(this.newAdministratif).subscribe({
          next: (administratif) => {
            this.administratifs = [...this.administratifs, administratif];
            this.toast.success("Administratif ajouté avec succès");
            this.newAdministratif = new Administratif();
            this.uploadedImage = undefined as any;
            this.imagePath = null;
            this.closeAddModal();
            this.cdr.detectChanges();
          },
          error: () => this.toast.danger("Erreur lors de l'ajout")
        });
      },
      error: () => this.toast.danger("Erreur upload image")
    });
  }


  updateAdministratif() {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[0-9]{8}$/;

    if (
      !this.newAdministratif.nom ||
      !this.newAdministratif.prenom ||
      !this.newAdministratif.email ||
      !this.newAdministratif.tlf ||
      !this.newAdministratif.fonction
    ) {
      this.toast.info("Veuillez remplir tous les champs");
      return;
    }
    if (!emailPattern.test(this.newAdministratif.email)) {
      this.toast.warning("Email invalide");
      return;
    }
    if (!phonePattern.test(this.newAdministratif.tlf)) {
      this.toast.warning("Numéro invalide (8 chiffres)");
      return;
    }

    const doUpdate = (adminToSave: Administratif) => {
      this.administratifService.updateAdministratif(adminToSave).subscribe({
        next: (updated) => {
          if (updated.image?.image) {
            updated.imageStr = this.bytesToBase64(updated.image.image);
          }
          const index = this.administratifs.findIndex(a => a.id === updated.id);
          if (index !== -1) {
            this.administratifs[index] = updated;
            this.administratifs = [...this.administratifs];
          }
          this.toast.success("Administratif modifié avec succès");
          this.closeAddModal();
          this.cdr.detectChanges();
        },
        error: () => this.toast.danger("Erreur lors de la modification")
      });
    };

    if (this.uploadedImage) {
      this.administratifService.uploadImage(this.uploadedImage, this.uploadedImage.name).subscribe({
        next: (img: Image) => {
          this.newAdministratif.image = img;
          this.newAdministratif.imageId = img.idImage;
          doUpdate(this.newAdministratif);
        },
        error: () => this.toast.danger("Erreur upload image")
      });
    } else {
      doUpdate(this.newAdministratif);
    }
  }

 
  supprimerAdministratif(admin: Administratif): void {
    this.adminToDelete = admin;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.adminToDelete = null;
  }

  confirmDelete(): void {
    if (!this.adminToDelete) return;
    const admin = this.adminToDelete;

    this.administratifService.deleteAdministratif(admin).subscribe({
      next: () => {
        const index = this.administratifs.findIndex(a => a.id === admin.id);
        if (index !== -1) {
          this.administratifs.splice(index, 1);
          this.administratifs = [...this.administratifs];
        }
        this.closeDeleteModal();
        this.toast.success("Administratif supprimé avec succès");
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.danger("Erreur lors de la suppression");
        this.closeDeleteModal();
      }
    });
  }

  
  onImageUpload(event: any): void {
    this.uploadedImage = event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(this.uploadedImage);
    reader.onload = (_event) => { this.imagePath = reader.result; };
  }

  getImageUrl(img: Image): string {
    if (!img?.image) return '';
    if (typeof img.image === 'string') {
      return `data:${img.type};base64,${img.image}`;
    }
    try {
      return `data:${img.type};base64,${this.bytesToBase64(img.image)}`;
    } catch (e) {
      console.error('Erreur conversion image:', e);
      return '';
    }
  }

  private bytesToBase64(bytes: number[]): string {
    const u8 = new Uint8Array(bytes);
    let binary = '';
    u8.forEach(b => binary += String.fromCharCode(b));
    return window.btoa(binary);
  }
}