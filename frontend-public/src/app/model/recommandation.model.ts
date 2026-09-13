import { Evenement } from './evenement.model';
import { Membre } from './membre.model';

export class Recommandation {
  id?: number;
  membre!: Membre;
  evenement!: Evenement;
  explication?: string;
}