import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Image } from '../model/image.model';

@Injectable({
  providedIn: 'root',
})
export class AdhesionService {

  constructor(private http: HttpClient) {}

  // Ancien: /api/valider-adherent  →  Nouveau: /api/validation.php (POST direct, sans action)
  private urlIA      = `${environment.apiBaseUrl}/api/validation.php`;
  // Ancien: /api/membres            →  Nouveau: /api/membres.php?action=xxx
  private urlMembres = `${environment.apiBaseUrl}/api/membres.php`;
  // Ancien: /api/images             →  Nouveau: /api/image.php?action=xxx
  private imageURL   = `${environment.apiBaseUrl}/api/image.php`;

  validerAvecIA(formData: FormData): Observable<any> {
    // Ancien: POST /api/valider-adherent
    // Nouveau: POST /api/validation.php  (pas d'action, endpoint direct)
    return this.http.post(this.urlIA, formData);
  }

  getAllMembres(): Observable<any[]> {
    // Ancien: GET /api/membres/all
    // Nouveau: GET /api/membres.php?action=all
    return this.http.get<any[]>(`${this.urlMembres}?action=all`);
  }

  sauvegarderMembre(membre: any): Observable<any> {
    // Ancien: POST /api/membres/ajouter
    // Nouveau: POST /api/membres.php?action=ajouter
    return this.http.post<any>(`${this.urlMembres}?action=ajouter`, membre);
  }

  uploadImage(file: File, filename: string): Observable<Image> {
    // Ancien: POST /api/images/upload
    // Nouveau: POST /api/image.php?action=upload
    const imageFormData = new FormData();
    imageFormData.append('file', file, filename);
    return this.http.post<Image>(`${this.imageURL}?action=upload`, imageFormData);
  }

  loadImage(id: number): Observable<Image> {
    // Ancien: GET /api/images/details/:id
    // Nouveau: GET /api/image.php?action=details&id=:id
    return this.http.get<Image>(`${this.imageURL}?action=details&id=${id}`);
  }
}
