import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private apiURL = '/api/stats';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('myToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getDashboardStats(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(
      `${this.apiURL}/dashboard`,
      { headers: this.getHeaders() }
    );
  }

  getMemberEvolution(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(
      `${this.apiURL}/membres/evolution`,
      { headers: this.getHeaders() }
    );
  }

  getDistributionByStatut(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(
      `${this.apiURL}/membres/distribution`,
      { headers: this.getHeaders() }
    );
  }
}
