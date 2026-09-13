import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Toast } from '../model/toast.model';
import { ToastService } from '../services/toast';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrls: ['./toast.css']
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private sub!: Subscription;

  constructor(private toastService: ToastService,private cdr: ChangeDetectorRef) {}

 ngOnInit(): void {
  this.sub = this.toastService.toasts$.subscribe(toasts => {
    console.log('DEBUG ToastComponent - toasts reçus:', toasts);  
    this.toasts = toasts;
     this.cdr.detectChanges();
  });
}

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  close(id: number): void {
    this.toastService.remove(id);
  }

  // Retourne le nom d'icône SVG à utiliser selon le type
  getIconPath(type: string): string {
    switch (type) {
      case 'success':
        return 'M9 12.75L11.25 15 15 9.75M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z';
      case 'error':
        return 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z';
      case 'warning':
        return 'M12 9v3.75m0 3.75h.007M21.75 12c0 5.385-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25 21.75 6.615 21.75 12z';
      case 'info':
      default:
        return 'M11.25 11.25h1.5v5.25h-1.5v-5.25zM12 8.25h.007M21.75 12c0 5.385-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25 21.75 6.615 21.75 12z';
    }
  }
}