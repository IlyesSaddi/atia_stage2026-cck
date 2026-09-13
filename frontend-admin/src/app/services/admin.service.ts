import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Admin } from '../model/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
    helper = new JwtHelperService();
    loginUserUrl : string = '/api/admin/login'; 
    constructor(private http: HttpClient) { } 
  login(a:Admin) {
    return this.http.post<any>(this.loginUserUrl, a);
  }
  isLoggedIn() {
    let token = localStorage.getItem("myToken");
  
    if (token) {
      return true;
    } else {
      return false;
    }
  }
  

}
