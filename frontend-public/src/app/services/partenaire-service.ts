import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Image } from '../model/image.model';
import { Partenaire } from '../model/partenaire.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PartenaireService {

  private apiURL   = `${environment.apiBaseUrl}/api/partenaires.php`;
  private imageURL = `${environment.apiBaseUrl}/api/image.php`;

  constructor(private http: HttpClient) {}

  listePartenaires(): Observable<Partenaire[]> {
    return this.http.get<Partenaire[]>(`${this.apiURL}?action=all`);
  }

  loadImage(id: number): Observable<Image> {
    return this.http.get<Image>(`${this.imageURL}?action=details&id=${id}`);
  }
}
