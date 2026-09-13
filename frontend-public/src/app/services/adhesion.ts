import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Image } from '../model/image.model';
@Injectable({
  providedIn: 'root',
})
export class AdhesionService {
  constructor(private http: HttpClient) {}
  private urlIA = '/api/valider-adherent'; 
  private urlAPI = '/api/membres'; 

  imageURL: string = '/api/images';
  validerAvecIA(formData: FormData): Observable<any> {
    return this.http.post(this.urlIA, formData);
  }


  getAllMembres(): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlAPI}/all`);
  }

  sauvegarderMembre(membre: any): Observable<any> {
    return this.http.post<any>(`${this.urlAPI}/ajouter`, membre);
  }
uploadImage(file: File, filename: string): Observable<Image> {
  const imageFormData = new FormData();
  imageFormData.append('file', file, filename);

  return this.http.post<Image>(
    `${this.imageURL}/upload`,
    imageFormData   
  );
}

loadImage(id: number): Observable<Image> {
  return this.http.get<Image>(
    `${this.imageURL}/details/${id}`
  );
}
}
