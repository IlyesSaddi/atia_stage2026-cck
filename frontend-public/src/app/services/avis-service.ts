import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Avis } from '../model/avis.model';

@Injectable({
  providedIn: 'root',
})
export class AvisService {

  private baseUrl = '/api/avis';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('membreToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

ajouterAvis(contenu: string, membreId: number, evenementId: number): Observable<Avis> {
  return this.http.post<Avis>(
    this.baseUrl,
    { contenu, membreId, evenementId },
    { headers: this.getHeaders() }
  );
}
modifierAvis(id: number, contenu: string): Observable<Avis> {
  return this.http.put<Avis>(
    `${this.baseUrl}/${id}`,
    { contenu },
    { headers: this.getHeaders() }
  );
}
  getAllAvis(): Observable<Avis[]> {
    return this.http.get<Avis[]>(this.baseUrl, { headers: this.getHeaders() });
  }

  getAvisByMembre(membreId: number): Observable<Avis[]> {
    return this.http.get<Avis[]>(`${this.baseUrl}/membre/${membreId}`, { headers: this.getHeaders() });
  }

  getAvisByEvenement(evenementId: number): Observable<Avis[]> {
    return this.http.get<Avis[]>(`${this.baseUrl}/evenement/${evenementId}`, { headers: this.getHeaders() });
  }

  supprimerAvis(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }

  getTopAvis(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/top`);
  }
}