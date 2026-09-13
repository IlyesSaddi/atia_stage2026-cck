import { Image } from '../model/image.model';

export class Administratif {
  id?: number;
  nom!: string;
  prenom!: string;
  fonction!: string;
  email!: string;
  tlf!: string;

  image!: Image;
  imageStr!: string;
}