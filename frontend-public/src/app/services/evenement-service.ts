import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Image } from '../model/image.model';
import { Evenement } from '../model/evenement.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EvenementService {

  // Appels directs aux fichiers PHP (compatibles dev local + production)
  private apiURL   = `${environment.apiBaseUrl}/api/evenements.php`;
  private imageURL = `${environment.apiBaseUrl}/api/image.php`;

  constructor(private http: HttpClient) {}

  listeEvenements(): Observable<Evenement[]> {
    return this.http.get<Evenement[]>(`${this.apiURL}?action=all`);
  }

  getEvenementById(id: number): Observable<Evenement> {
    return this.http.get<Evenement>(`${this.apiURL}?action=get&id=${id}`);
  }

  loadImage(id: number): Observable<Image> {
    return this.http.get<Image>(`${this.imageURL}?action=details&id=${id}`);
  }
}
