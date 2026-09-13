export type ToastType = 'success' | 'error' | 'warning' | 'info';
 
export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;        }