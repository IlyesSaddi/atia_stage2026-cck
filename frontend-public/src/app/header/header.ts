import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdhesionModalService } from '../adhesion-modal/adhesion-modal.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private readonly adhesionModal = inject(AdhesionModalService);

  isMenuOpen = false;

  openAdhesionModal(): void {
    this.adhesionModal.open();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    document.body.style.overflow = '';
  }
}