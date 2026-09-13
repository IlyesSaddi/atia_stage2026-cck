export interface NotifMembre {
  id: number;
  message: string;
  type: 'NOUVEL_EVENEMENT' | 'ABONNEMENT_EXPIRE';
  dateCreation: string;
  lu: boolean;
}