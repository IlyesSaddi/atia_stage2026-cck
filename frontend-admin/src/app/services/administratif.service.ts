import { HttpClient, HttpHeaders } from '@angular/common/http';
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
        `${this.apiURL}/ajouter`, 
        administratif, 
        { headers: this.getHeaders() }  
      );
    }
  
    listeAdministratifs(): Observable<Administratif[]> {
      return this.http.get<Administratif[]>(
        `${this.apiURL}/all`,
        { headers: this.getHeaders() } 
      );
    }
      deleteAdministratif(administratif: Administratif): Observable<void> {
      return this.http.delete<void>(
        `${this.apiURL}/delete`, 
        { 
          headers: this.getHeaders(),
          body: administratif  
        }
      );
    }
    updateAdministratif(administratif: Administratif): Observable<Administratif> {
      return this.http.put<Administratif>(
        `${this.apiURL}/update`,
        administratif,
        { headers: this.getHeaders() }
      );
    }
    uploadImage(file: File, filename: string): Observable<Image> {
      const token = localStorage.getItem('myToken');
      const imageFormData = new FormData();
      imageFormData.append('file', file, filename);
      return this.http.post<Image>(
        `${this.imageURL}/upload`, 
        imageFormData,
        { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) } 
      );
    }
  
    loadImage(id: number): Observable<Image> {
      return this.http.get<Image>(
        `${this.imageURL}/details/${id}`,
        { headers: this.getHeaders() } 
      );
    }
     deleteImage(id: number): Observable<void> {
  const token = localStorage.getItem('myToken');
  return this.http.delete<void>(
    `${this.imageURL}/${id}`,
    { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) }
  );
}
}
