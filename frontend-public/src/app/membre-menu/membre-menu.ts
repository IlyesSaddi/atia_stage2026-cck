import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-membre-menu',
  imports: [RouterModule],
  templateUrl: './membre-menu.html',
  styleUrl: './membre-menu.css',
})
export class MembreMenu {
  
  isOpen = false;

  constructor(private router: Router) {}

  toggleSidebar(): void {
    this.isOpen = !this.isOpen;
  }

  closeSidebar(): void {
    this.isOpen = false;
  }

  onLogout(): void {
    localStorage.clear();
    this.router.navigate(['/espace-membre']);
  }
}
