import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Membre } from '../model/Membre.model';
import { Image } from '../model/image.model';

@Injectable({
  providedIn: 'root',
})
export class MembreService {
   private apiUrl  = '/api/membres';
  private imageURL = '/api/images';
 
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
      `${this.apiUrl}/actifs`,
      { headers: this.getHeaders() }
    );
  }

  getMembresExpires(): Observable<Membre[]> {
    return this.http.get<Membre[]>(
      `${this.apiUrl}/expires`,
      { headers: this.getHeaders() }
    );
  }

  getMembresEnAttente(): Observable<Membre[]> {
    return this.http.get<Membre[]>(
      `${this.apiUrl}/en-attente`,
      { headers: this.getHeaders() }
    );
  }
 
  activerMembre(id: number): Observable<Membre> {
    return this.http.put<Membre>(
      `${this.apiUrl}/activer/${id}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  supprimerMembre(id: number): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/delete/${id}`,
      { headers: this.getHeaders() }
    );
  }

  ajouterMembre(membre: Partial<Membre>): Observable<Membre> {
    return this.http.post<Membre>(
      `${this.apiUrl}/ajouter`,
      membre,
      { headers: this.getHeaders() }
    );
  }
 
  loadImage(id: number): Observable<Image> {
    return this.http.get<Image>(
      `${this.imageURL}/details/${id}`,
      { headers: this.getHeaders() }
    );
  }
}
