import { Image } from '../model/image.model';
export enum StatutType {
  ETUDIANT = 'ETUDIANT',
  CHERCHEUR = 'CHERCHEUR',
  ENSEIGNANT = 'ENSEIGNANT',
  PROFESSIONNEL = 'PROFESSIONNEL'
}

export enum StatutMembre {
  EN_ATTENTE = 'EN_ATTENTE',
  ACTIF = 'ACTIF',
  EXPIRE = 'EXPIRE'
}


export class Membre {
  id?: number;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  dateNaissance?: string; 
  statut?: StatutType;
  cinNumero?: string;
  password?: string;
  consentement?: boolean;
  centresInteret?: string[] = [];
  statutMembre?: StatutMembre;
  referenceMembre?: string;
  dateAdhesion?: string; 
  dateSubmission?: string; 

 
  cinImage?: Image;
  cinImageStr?: string;

  justificatifImage?: Image;
  justificatifImageStr?: string;

  recuPaiementImage?: Image;
  recuPaiementImageStr?: string;

  
  
}