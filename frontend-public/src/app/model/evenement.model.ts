import { Image } from '../model/image.model';
export enum TypeEvenement {
  WORKSHOP = 'WORKSHOP',
  CONFERENCE = 'CONFERENCE',
  HACKATHON = 'HACKATHON',
  MEETUP = 'MEETUP',
  FORMATION = 'FORMATION'
}
export class Evenement {
  id?: number;
  titre!: string;
  description!: string;
  date!: string;
  heure!: string;
  lieu!: string;
  imageId?: number;
  image! : Image 
imageStr!:string 
 type!: TypeEvenement;
  etat!: string;
}