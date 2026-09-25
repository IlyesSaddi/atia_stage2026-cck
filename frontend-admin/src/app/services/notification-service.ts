import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { NotifAdmin } from '../model/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private base = `${environment.apiBaseUrl}/api/notifications.php`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('myToken') ?? '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getNonLuesAdmin(adminId: number): Observable<NotifAdmin[]> {
    return this.http.get<NotifAdmin[]>(
      `${this.base}?action=admin&id=${adminId}`,
      { headers: this.getHeaders() }
    );
  }

  marquerCommeLue(id: number): Observable<void> {
    return this.http.put<void>(
      `${this.base}?action=lire&id=${id}`,
      {},
      { headers: this.getHeaders() }
    );
  }

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