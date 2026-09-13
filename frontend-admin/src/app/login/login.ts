import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../services/admin.service';
import { Router } from '@angular/router';
import { NgToastService } from 'ng-angular-popup';
import { Admin } from '../model/admin.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  loginForm: FormGroup=new FormGroup({});
  constructor(
    private fb: FormBuilder,
    private service:AdminService,
    private router:Router,private toast:NgToastService
  ) { 
    let formControls = {
      email: new FormControl('',[
        Validators.required,
        Validators.email
        
      ]),
      password: new FormControl('',[
        Validators.required,
       
      ])
    }

    this.loginForm = this.fb.group(formControls)
  }
  ngOnInit(): void {
      let isLoggedIn = this.service.isLoggedIn();
    

  if (isLoggedIn) {
    this.router.navigate(['/']);
  } 

  }
   get email() { return this.loginForm.get('email') }
  get mp() { return this.loginForm.get('password') }
  login() {
  let data = this.loginForm.value;

  let admin: Admin = {
    email: data.email,
    password: data.password
  };

  // Vérification des champs
  if (!admin.email || !admin.password) {
    this.toast.info("Veuillez remplir tous les champs");
    return;
  }

 
  this.service.login(admin).subscribe(
    res => {
      console.log(res);

      
      localStorage.setItem("myToken", res.token);

      this.toast.success("Connexion réussie");

      
     this.router.navigate(['/dashboard']);
    },
    err => {
      console.log(err);

      this.toast.danger("Email ou mot de passe incorrect");
    }
  );
}
}
