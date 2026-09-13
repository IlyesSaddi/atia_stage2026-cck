export interface NotifAdmin {
  id: number;
  message: string;
  type: 'NOUVELLE_DEMANDE';
  dateCreation: string;
  lu: boolean;
}