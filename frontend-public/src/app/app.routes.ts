import { Routes } from '@angular/router';
import { Accueil } from './accueil/accueil';
import { Login } from './login/login';
import { Adhesion } from './adhesion/adhesion';
import { MembreDashboard } from './membre-dashboard/membre-dashboard';
import { Profile } from './profile/profile';
import { Evenements } from './evenements/evenements';
import { EvenementsDetails } from './evenements-details/evenements-details';
import { MesAvis } from './mes-avis/mes-avis';
import { EvenementsPublic } from './evenements-public/evenements-public';
import { DefinirMotDePasse } from './definir-mot-de-passe/definir-mot-de-passe';
import { MotDePasseOublie } from './mot-de-passe-oublie/mot-de-passe-oublie';
import { MembreAuthGuard } from './services/membre-auth-guard';

export const routes: Routes = [
  { path: '', component: Accueil },
  { path: 'espace-membre', component: Login },
  { path: 'demande-adhesion', component: Adhesion },
  { path: 'tableau-de-bord', component: MembreDashboard, canActivate: [MembreAuthGuard] },
  { path: 'profil', component: Profile, canActivate: [MembreAuthGuard] },
  { path: 'evenements', component: Evenements, canActivate: [MembreAuthGuard] },
  { path: 'evenements/:id', component: EvenementsDetails, canActivate: [MembreAuthGuard] },
  { path: 'mes-avis', component: MesAvis, canActivate: [MembreAuthGuard] },
  { path: 'agenda', component: EvenementsPublic },
  { path: 'definir-mot-de-passe', component: DefinirMotDePasse },
  { path: 'mot-de-passe-oublie', component: MotDePasseOublie },
  // ── Redirects pour compatibilité ──
  { path: 'adhesion',  redirectTo: 'demande-adhesion', pathMatch: 'full' },
  { path: 'login',     redirectTo: 'espace-membre',    pathMatch: 'full' },
  { path: 'register',  redirectTo: 'demande-adhesion', pathMatch: 'full' },
  // ── Wildcard → accueil ──
  { path: '**', redirectTo: '' },
];

