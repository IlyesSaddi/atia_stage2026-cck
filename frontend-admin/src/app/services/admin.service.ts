import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from '../../environments/environment';
import { Admin } from '../model/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  helper = new JwtHelperService();
  // Login admin via auth.php directement (compatible local + production)
  loginUserUrl: string = `${environment.apiBaseUrl}/api/auth.php?action=login-admin`;

  constructor(private http: HttpClient) { }

  login(a: Admin) {
    return this.http.post<any>(this.loginUserUrl, a);
  }

  isLoggedIn() {
    const token = localStorage.getItem('myToken');
    return !!token;
  }
}
