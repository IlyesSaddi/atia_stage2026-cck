import { Image } from '../model/image.model';
export enum TypePartenaire {
  ACADEMIQUE = 'ACADEMIQUE',
  ENTREPRISE = 'ENTREPRISE',
  INSTITUTION = 'INSTITUTION',
  ONG = 'ONG'
}
export class Partenaire {
  id?: number;
  nom!: string;
  siteweb!: string;
  description!: string;
 
  email!: string;
  telephone!: string;
  datePartenariat!: string; 

 
  type!: TypePartenaire;

  imageId?: number;
  image!: Image;
  imageStr!: string;
}