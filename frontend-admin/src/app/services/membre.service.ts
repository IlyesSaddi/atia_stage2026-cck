import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Membre } from '../model/Membre.model';
import { Image } from '../model/image.model';

@Injectable({
  providedIn: 'root',
})
export class MembreService {
  private apiUrl   = `${environment.apiBaseUrl}/api/membres.php`;
  private imageURL = `${environment.apiBaseUrl}/api/image.php`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('myToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getMembresActifs(): Observable<Membre[]> {
    return this.http.get<Membre[]>(
      `${this.apiUrl}?action=actifs`,
      { headers: this.getHeaders() }
    );
  }

  getMembresExpires(): Observable<Membre[]> {
    return this.http.get<Membre[]>(
      `${this.apiUrl}?action=expires`,
      { headers: this.getHeaders() }
    );
  }

  getMembresEnAttente(): Observable<Membre[]> {
    return this.http.get<Membre[]>(
      `${this.apiUrl}?action=en-attente`,
      { headers: this.getHeaders() }
    );
  }

  activerMembre(id: number): Observable<Membre> {
    return this.http.put<Membre>(
      `${this.apiUrl}?action=activer&id=${id}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  expireMembre(id: number): Observable<Membre> {
    return this.http.put<Membre>(
      `${this.apiUrl}?action=expirer&id=${id}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  supprimerMembre(id: number): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}?action=delete&id=${id}`,
      { headers: this.getHeaders() }
    );
  }

  ajouterMembre(membre: Partial<Membre>): Observable<Membre> {
    return this.http.post<Membre>(
      `${this.apiUrl}?action=ajouter`,
      membre,
      { headers: this.getHeaders() }
    );
  }

  loadImage(id: number): Observable<Image> {
    return this.http.get<Image>(
      `${this.imageURL}?action=details&id=${id}`,
      { headers: this.getHeaders() }
    );
  }
}
