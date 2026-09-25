import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Recommandation } from '../model/recommandation.model';

@Injectable({
  providedIn: 'root',
})
export class RecommandationService {
  // Note: fichier PHP s'appelle recommandation.php (singulier)
  private apiURL = `${environment.apiBaseUrl}/api/recommandation.php`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('membreToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getRecommandations(membreId: number): Observable<Recommandation[]> {
    return this.http.get<Recommandation[]>(
      `${this.apiURL}?action=get&id=${membreId}`,
      { headers: this.getHeaders() }
    );
  }
}