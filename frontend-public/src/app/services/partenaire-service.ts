import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Partenaire } from '../model/partenaire.model';
import { Image } from '../model/image.model';

@Injectable({
  providedIn: 'root',
})
export class PartenaireService {

  apiURL: string = '/api/partenaires';
  imageURL: string = '/api/images';

  constructor(private http: HttpClient) {}

  listePartenaires(): Observable<Partenaire[]> {
    return this.http.get<Partenaire[]>(`${this.apiURL}/all`);
  }

  loadImage(id: number): Observable<Image> {
    return this.http.get<Image>(`${this.imageURL}/details/${id}`);
  }
}
