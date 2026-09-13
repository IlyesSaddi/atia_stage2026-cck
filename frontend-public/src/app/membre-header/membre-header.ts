import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NotificationService, SSEHandle } from '../services/notification-service';
import { NotifMembre } from '../model/notification.model';
import { MembreService } from '../services/membre-service';

@Component({
  selector: 'app-membre-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './membre-header.html',
  styleUrl: './membre-header.css',
})
export class MembreHeader implements OnInit, OnDestroy {
  pageTitle    = 'Tableau de bord';
  userInitials = 'AB';

  notifications: NotifMembre[] = [];
  showNotifPanel = false;
  showUserMenu   = false;

  private eventSource!: SSEHandle;

  private routeTitles: { [key: string]: string } = {
    '/tableau-de-bord': 'Tableau de bord',
    '/profil':          'Mon Profil',
    '/evenements':      'Evenements',
    '/notifications':   'Notifications',
    '/mes-avis':        'Mes avis',
  };

  constructor(
    private router: Router,
    private notifService: NotificationService,
    private membreService: MembreService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.pageTitle = this.routeTitles[this.router.url] ?? 'Tableau de bord';
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.pageTitle = this.routeTitles[e.urlAfterRedirects] ?? 'Tableau de bord';
      });

    const membre = this.membreService.getMembreFromToken();
    if (membre) {
      const n = membre.nom?.[0] ?? '';
      const p = membre.prenom?.[0] ?? '';
      this.userInitials = (p + n).toUpperCase();
    }
    const membreId = membre?.id;
    if (!membreId) return;

    this.notifService.getNonLuesMembre(membreId).subscribe(notifs => {
      this.notifications = notifs;
      this.cdr.detectChanges();
    });

    this.eventSource = this.notifService.connecterSSE(membreId, (notif) => {
      this.zone.run(() => {
        this.notifications = [notif, ...this.notifications];
        this.cdr.detectChanges();
      });
    });
  }

  ngOnDestroy(): void {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }

  get notifCount(): number {
    return this.notifications.filter(n => !n.lu).length;
  }

  toggleNotifications(): void {
    this.showNotifPanel = !this.showNotifPanel;
    this.showUserMenu   = false;
  }

  marquerLue(notif: NotifMembre): void {
    if (notif.lu) return;
    this.notifService.marquerCommeLue(notif.id).subscribe(() => {
      notif.lu = true;
      this.notifications = [...this.notifications];
      this.cdr.detectChanges();
    });
  }

  toutMarquerLues(): void {
    this.notifications
      .filter(n => !n.lu)
      .forEach(n => this.marquerLue(n));
  }

  toggleUserMenu(): void {
    this.showUserMenu   = !this.showUserMenu;
    this.showNotifPanel = false;
  }

  closeMenus(): void {
    this.showUserMenu   = false;
    this.showNotifPanel = false;
  }

  onLogout(): void {
    this.closeMenus();
    if (this.eventSource) this.eventSource.close();
    this.router.navigate(['/espace-membre']);
  }

  getIcon(type: string): string {
    return type === 'ABONNEMENT_EXPIRE' ? '⚠️' : '📅';
  }
  getTemps(date: string | Date): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60)  return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
}