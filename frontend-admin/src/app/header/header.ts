import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../services/notification-service';
import { NotifAdmin } from '../model/notification.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy {
  today = '';

  notifications: NotifAdmin[] = [];
  showNotifPanel = false;
  showUserMenu   = false;

  private eventSource: { close: () => void } | null = null;

  constructor(
    private router: Router,
    private notifService: NotificationService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.today = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    const adminId = this.getAdminIdFromToken();
    if (!adminId) return;

    this.notifService.getNonLuesAdmin(adminId).subscribe(notifs => {
      this.notifications = notifs;
      this.cdr.detectChanges();
    });

    this.eventSource = this.notifService.connecterSSE(adminId, (notif) => {
      this.zone.run(() => {
        this.notifications = [notif, ...this.notifications];
        this.cdr.detectChanges();
      });
    });
  }

  ngOnDestroy(): void {
    if (this.eventSource) this.eventSource.close();
  }

  private getAdminIdFromToken(): number | null {
    const token = localStorage.getItem('myToken');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id ?? payload.adminId ?? null;
    } catch {
      return null;
    }
  }

  get notifCount(): number {
    return this.notifications.filter(n => !n.lu).length;
  }

  toggleNotifications(): void {
    this.showNotifPanel = !this.showNotifPanel;
    this.showUserMenu   = false;
  }

  marquerLue(notif: NotifAdmin): void {
    if (notif.lu) return;
    this.notifService.marquerCommeLue(notif.id).subscribe(() => {
      notif.lu = true;
      this.notifications = [...this.notifications];
      this.cdr.detectChanges();
    });
  }

  toutMarquerLues(): void {
    this.notifications.filter(n => !n.lu).forEach(n => this.marquerLue(n));
  }

  toggleUserMenu(): void {
    this.showUserMenu   = !this.showUserMenu;
    this.showNotifPanel = false;
  }

  closeMenus(): void {
    this.showUserMenu   = false;
    this.showNotifPanel = false;
  }

  logout(): void {
    this.closeMenus();
    if (this.eventSource) this.eventSource.close();
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  getIcon(_type: string): string {
    return '👤';
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}
