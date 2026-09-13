import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Recommandation } from '../model/recommandation.model';

@Injectable({
  providedIn: 'root',
})
export class RecommandationService {
  private apiURL = '/api/recommandations';

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
      `${this.apiURL}/${membreId}`,
      { headers: this.getHeaders() }
    );
  }
}