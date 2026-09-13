import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotifAdmin } from '../model/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private base = '/api/notifications';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('myToken') ?? '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getNonLuesAdmin(membreId: number): Observable<NotifAdmin[]> {
    return this.http.get<NotifAdmin[]>(
      `${this.base}/admin/${membreId}`,
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

  // SSE non dispo en dev PHP : on utilise un polling régulier
  private seenNotifIds = new Set<number>();

  connecterSSE(userId: number, onNotif: (n: NotifAdmin) => void): { close: () => void } {
    const poll = () => {
      this.getNonLuesAdmin(userId).subscribe(notifs => {
        (notifs || []).forEach(n => {
          if (!this.seenNotifIds.has(n.id)) {
            this.seenNotifIds.add(n.id);
            onNotif(n);
          }
        });
      });
    };
    poll();
    const interval = setInterval(poll, 12000);
    return { close: () => clearInterval(interval) };
  }
}