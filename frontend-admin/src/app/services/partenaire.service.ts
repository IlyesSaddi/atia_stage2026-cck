import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Image } from '../model/image.model';
import { Observable } from 'rxjs';
import { Partenaire, TypePartenaire } from '../model/partneraire.model';
@Injectable({
  providedIn: 'root',
})
export class PartenaireService{
    apiURL: string = '/api/partenaires';
  imageURL: string = '/api/images';
    constructor(private http: HttpClient) { }

  
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('myToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
   ajouterPartenaire(partenaire: Partenaire): Observable<Partenaire> {
      return this.http.post<Partenaire>(
        `${this.apiURL}/ajouter`, 
        partenaire, 
        { headers: this.getHeaders() }  
      );
    }
  
    listePartenaires(): Observable<Partenaire[]> {
      return this.http.get<Partenaire[]>(
        `${this.apiURL}/all`,
        { headers: this.getHeaders() } 
      );
    }
    deletePartenaire(partenaire: Partenaire): Observable<void> {
          return this.http.delete<void>(
            `${this.apiURL}/delete`, 
            { 
              headers: this.getHeaders(),
              body: partenaire  
            }
          );
        }
        updatePartenaire(partenaire: Partenaire): Observable<Partenaire> {
          return this.http.put<Partenaire>(
            `${this.apiURL}/update`,
            partenaire,
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
    searchByNom(nom: string): Observable<Partenaire[]> {
  return this.http.get<Partenaire[]>(
    `${this.apiURL}/search/nom/${nom}`,
    { headers: this.getHeaders() }
  );
}

searchByType(type: TypePartenaire): Observable<Partenaire[]> {
  return this.http.get<Partenaire[]>(
    `${this.apiURL}/search/type/${type}`,
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
