import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Image } from '../model/image.model';
import { Administratif } from '../model/administratif.model';

@Injectable({
  providedIn: 'root',
})
export class AdministratifService {

  // Ancien: /api/administratif  →  Nouveau: /api/administratif.php?action=xxx
  private apiURL   = `${environment.apiBaseUrl}/api/administratif.php`;
  // Ancien: /api/images          →  Nouveau: /api/image.php?action=xxx
  private imageURL = `${environment.apiBaseUrl}/api/image.php`;

  constructor(private http: HttpClient) {}

  listeAdministratifs(): Observable<Administratif[]> {
    // Ancien: GET /api/administratif/all
    // Nouveau: GET /api/administratif.php?action=all
    return this.http.get<Administratif[]>(`${this.apiURL}?action=all`);
  }

  loadImage(id: number): Observable<Image> {
    // Ancien: GET /api/images/details/:id
    // Nouveau: GET /api/image.php?action=details&id=:id
    return this.http.get<Image>(`${this.imageURL}?action=details&id=${id}`);
  }
}
