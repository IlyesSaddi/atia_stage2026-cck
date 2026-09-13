import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Toast, ToastType } from '../model/toast.model';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  private nextId = 0;

  private show(
    type: ToastType,
    title: string,
    message: string,
    options?: { duration?: number }
  ): void {
    const toast: Toast = {
      id: this.nextId++,
      type,
      title,
      message,
      duration: options?.duration ?? 5000
    };

    const current = this.toastsSubject.value;
    this.toastsSubject.next([...current, toast]);

    if (toast.duration && toast.duration > 0) {
      setTimeout(() => this.remove(toast.id), toast.duration);
    }
  }

  success(title: string, message: string, options?: { duration?: number }): void {
    this.show('success', title, message, options);
  }

  error(title: string, message: string, options?: { duration?: number }): void {
    this.show('error', title, message, options);
  }

  warning(title: string, message: string, options?: { duration?: number }): void {
    this.show('warning', title, message, options);
  }

  info(title: string, message: string, options?: { duration?: number }): void {
    this.show('info', title, message, options);
  }

  remove(id: number): void {
    const current = this.toastsSubject.value;
    this.toastsSubject.next(current.filter(t => t.id !== id));
  }

  clear(): void {
    this.toastsSubject.next([]);
  }
}