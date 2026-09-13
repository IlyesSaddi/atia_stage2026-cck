import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Membre } from '../model/membre.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MembreService {

  helper = new JwtHelperService();
  private baseUrl = '/api/membres';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('membreToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ─── Auth ───────────────────────────────────────────────────────────────────

  login(m: Membre): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/login`, m);
  }

  definirMotDePasse(token: string, motDePasse: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/definir-mot-de-passe`, { token, motDePasse });
  }

  motDePasseOublie(email: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/mot-de-passe-oublie`, { email });
  }

  logout(): void {
    localStorage.removeItem('membreToken');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('membreToken');
  }

  getMembreFromToken(): any {
    const token = localStorage.getItem('membreToken');
    return token ? this.helper.decodeToken(token) : null;
  }

  getMembreId(): number | null {
    const membre = this.getMembreFromToken();
    return membre ? membre.id : null;
  }

  // ─── Profil ──────────────────────────────────────────────────────────────────

  getMembreById(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  // ─── Contact ──────────────────────────────────

 updateContact(id: number, email: string, telephone: string): Observable<any> {
  return this.http.put<any>(
    `${this.baseUrl}/update-contact/${id}`,
    { email, telephone },
    { headers: this.getHeaders() }
  );
}

  // ─── Centres d'intérêt ───────────────────────────────────────────────────────

  addCentreInteret(id: number, centre: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${id}/centres-interet`,
      null,
      { params: { centre }, headers: this.getHeaders() }
    );
  }

  removeCentreInteret(id: number, centre: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${id}/centres-interet`,
      { params: { centre }, headers: this.getHeaders() }
    );
  }

  // ─── Mot de passe ────────────────────────────────────────────────────────────

  changePassword(id: number, motDePasseActuel: string, nouveauMotDePasse: string): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}/${id}/password`,
      { motDePasseActuel, nouveauMotDePasse },
      { headers: this.getHeaders() }
    );
  }
  downloadAttestation(id: number): Observable<Blob> {
  const token = localStorage.getItem('membreToken');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.get(
    `${this.baseUrl}/generer/${id}`,
    { headers, responseType: 'blob' }
  );
}
}