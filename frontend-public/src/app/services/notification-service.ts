import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotifMembre } from '../model/notification.model';

export interface SSEHandle {
  close(): void;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private base = '/api/notifications';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('membreToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getNonLuesMembre(membreId: number): Observable<NotifMembre[]> {
    return this.http.get<NotifMembre[]>(
      `${this.base}/membre/${membreId}`,
      { headers: this.getHeaders() }
    );
  }

  marquerCommeLue(id: number): Observable<void> {
    return this.http.put<void>(
      `${this.base}/${id}/lire`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Pas de SSE côté backend : on simule le "temps réel" par un sondage (polling)
   * de la liste des notifications non lues. Renvoie un handle avec close().
   */
  connecterSSE(userId: number, onNotif: (n: NotifMembre) => void): SSEHandle {
    let stopped = false;
    const knownIds = new Set<number>();

    // Chargement initial : on seed les IDs connus sans notifier
    this.getNonLuesMembre(userId).subscribe(notifs => {
      notifs.forEach(n => knownIds.add(n.id));
    });

    const tick = () => {
      if (stopped) return;
      this.getNonLuesMembre(userId).subscribe(notifs => {
        if (stopped) return;
        for (const n of notifs) {
          if (!knownIds.has(n.id)) {
            knownIds.add(n.id);
            onNotif(n);
          }
        }
      });
    };

    const interval = setInterval(tick, 10000);
    return {
      close: () => {
        stopped = true;
        clearInterval(interval);
      }
    };
  }
}
