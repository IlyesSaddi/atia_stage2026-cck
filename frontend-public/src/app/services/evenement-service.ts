import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Image } from '../model/image.model';
import { Evenement } from '../model/evenement.model';

@Injectable({
  providedIn: 'root',
})
export class EvenementService {

  apiURL: string = '/api/evenements';
  imageURL: string = '/api/images';

  constructor(private http: HttpClient) {}

  listeEvenements(): Observable<Evenement[]> {
    return this.http.get<Evenement[]>(`${this.apiURL}/all`);
  }

  getEvenementById(id: number): Observable<Evenement> {
    return this.http.get<Evenement>(`${this.apiURL}/${id}`);
  }

  loadImage(id: number): Observable<Image> {
    return this.http.get<Image>(`${this.imageURL}/details/${id}`);
  }
}
