import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Image } from '../model/image.model';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Partenaire, TypePartenaire } from '../model/partneraire.model';

@Injectable({
  providedIn: 'root',
})
export class PartenaireService {
  private apiURL   = `${environment.apiBaseUrl}/api/partenaires.php`;
  private imageURL = `${environment.apiBaseUrl}/api/image.php`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('myToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  ajouterPartenaire(partenaire: Partenaire): Observable<Partenaire> {
    return this.http.post<Partenaire>(
      `${this.apiURL}?action=ajouter`,
      partenaire,
      { headers: this.getHeaders() }
    );
  }

  listePartenaires(): Observable<Partenaire[]> {
    return this.http.get<Partenaire[]>(
      `${this.apiURL}?action=all`,
      { headers: this.getHeaders() }
    );
  }

  deletePartenaire(partenaire: Partenaire): Observable<void> {
    return this.http.delete<void>(
      `${this.apiURL}?action=delete&id=${partenaire.id}`,
      { headers: this.getHeaders() }
    );
  }

  updatePartenaire(partenaire: Partenaire): Observable<Partenaire> {
    return this.http.put<Partenaire>(
      `${this.apiURL}?action=update`,
      partenaire,
      { headers: this.getHeaders() }
    );
  }

  uploadImage(file: File, filename: string): Observable<Image> {
    const token = localStorage.getItem('myToken');
    const imageFormData = new FormData();
    imageFormData.append('file', file, filename);
    return this.http.post<Image>(
      `${this.imageURL}?action=upload`,
      imageFormData,
      { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) }
    );
  }

  loadImage(id: number): Observable<Image> {
    return this.http.get<Image>(
      `${this.imageURL}?action=details&id=${id}`,
      { headers: this.getHeaders() }
    );
  }

  searchByNom(nom: string): Observable<Partenaire[]> {
    return this.http.get<Partenaire[]>(
      `${this.apiURL}?action=search-nom&nom=${encodeURIComponent(nom)}`,
      { headers: this.getHeaders() }
    );
  }

  searchByType(type: TypePartenaire): Observable<Partenaire[]> {
    return this.http.get<Partenaire[]>(
      `${this.apiURL}?action=search-type&type=${encodeURIComponent(type)}`,
      { headers: this.getHeaders() }
    );
  }

  deleteImage(id: number): Observable<void> {
    const token = localStorage.getItem('myToken');
    return this.http.delete<void>(
      `${this.imageURL}?action=delete&id=${id}`,
      { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) }
    );
  }
}
