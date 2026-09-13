import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Image } from '../model/image.model';
import { Administratif } from '../model/administratif.model';

@Injectable({
  providedIn: 'root',
})
export class AdministratifService {

  apiURL: string = '/api/administratif';
  imageURL: string = '/api/images';

  constructor(private http: HttpClient) {}

  listeAdministratifs(): Observable<Administratif[]> {
    return this.http.get<Administratif[]>(`${this.apiURL}/all`);
  }

  loadImage(id: number): Observable<Image> {
    return this.http.get<Image>(`${this.imageURL}/details/${id}`);
  }
}
