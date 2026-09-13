export class Avis {
  id?: number;
  contenu: string = '';
  dateAvis?: string;
  membre?: { id: number; nom?: string; prenom?: string };
  evenement?: { id: number; titre?: string; date?: string; lieu?: string; image?: any; imageStr?: string; imageId?: number };
}