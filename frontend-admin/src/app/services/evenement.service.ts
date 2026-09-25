import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Evenement } from '../model/evenement.model';
import { Image } from '../model/image.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EvenementService {
  private apiURL   = `${environment.apiBaseUrl}/api/evenements.php`;
  private imageURL = `${environment.apiBaseUrl}/api/image.php`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('myToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  ajouterEvenement(event: Evenement): Observable<Evenement> {
    return this.http.post<Evenement>(
      `${this.apiURL}?action=ajouter`,
      event,
      { headers: this.getHeaders() }
    );
  }

  listeEvenement(): Observable<Evenement[]> {
    return this.http.get<Evenement[]>(
      `${this.apiURL}?action=all`,
      { headers: this.getHeaders() }
    );
  }

  deleteEvenement(event: Evenement): Observable<void> {
    return this.http.delete<void>(
      `${this.apiURL}?action=delete&id=${event.id}`,
      { headers: this.getHeaders() }
    );
  }

  updateEvenement(event: Evenement): Observable<Evenement> {
    return this.http.put<Evenement>(
      `${this.apiURL}?action=update`,
      event,
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