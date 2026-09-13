import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Menu } from './menu/menu';
import { Header } from './header/header';
import { Dashboard } from './dashboard/dashboard';
import { GestionEvenement } from './gestion-evenement/gestion-evenement';

import { BureauExecutif } from './bureau-executif/bureau-executif';

import { ListePartner } from './liste-partner/liste-partner';
import { AuthGuard } from './services/auth-guard';
import { DemandeAdhesion } from './demande-adhesion/demande-adhesion';
import { Membres } from './membres/membres';


export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: Login }, 

    
    { path: 'dashboard',            component: Dashboard,           canActivate: [AuthGuard] },
    { path: 'header',               component: Header,              canActivate: [AuthGuard] },
    { path: 'menu',                 component: Menu,                canActivate: [AuthGuard] },
    { path: 'gestion-evenement',    component: GestionEvenement,    canActivate: [AuthGuard] },
    
    { path: 'liste-partner',        component: ListePartner,        canActivate: [AuthGuard] },
    { path: 'Bureau',               component: BureauExecutif,      canActivate: [AuthGuard] },
    { path: 'Demandes',             component: DemandeAdhesion,      canActivate: [AuthGuard] },
    { path: 'membres',              component: Membres,              canActivate: [AuthGuard] },

    { path: '**', redirectTo: 'login' },
];
