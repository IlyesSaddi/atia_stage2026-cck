import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Image } from '../model/image.model';
import { Administratif } from '../model/administratif.model';

@Injectable({
  providedIn: 'root',
})
export class AdministratifService {
  private apiURL   = `${environment.apiBaseUrl}/api/administratif.php`;
  private imageURL = `${environment.apiBaseUrl}/api/image.php`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('myToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  ajouterAdministratif(administratif: Administratif): Observable<Administratif> {
    return this.http.post<Administratif>(
      `${this.apiURL}?action=ajouter`,
      administratif,
      { headers: this.getHeaders() }
    );
  }

  listeAdministratifs(): Observable<Administratif[]> {
    return this.http.get<Administratif[]>(
      `${this.apiURL}?action=all`,
      { headers: this.getHeaders() }
    );
  }

  deleteAdministratif(administratif: Administratif): Observable<void> {
    return this.http.delete<void>(
      `${this.apiURL}?action=delete&id=${administratif.id}`,
      { headers: this.getHeaders() }
    );
  }

  updateAdministratif(administratif: Administratif): Observable<Administratif> {
    return this.http.put<Administratif>(
      `${this.apiURL}?action=update`,
      administratif,
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

  deleteImage(id: number): Observable<void> {
    const token = localStorage.getItem('myToken');
    return this.http.delete<void>(
      `${this.imageURL}?action=delete&id=${id}`,
      { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) }
    );
  }
}
