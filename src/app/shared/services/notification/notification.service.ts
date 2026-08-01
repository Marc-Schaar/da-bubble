import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error';

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  leaving: boolean;
}

const TOAST_DURATION_MS = 3000;

/**
 * Holds the currently visible slide-in toasts (rendered by
 * ToastContainerComponent, mounted once at the app root) for the app's
 * short-lived confirmation messages (e.g. "Konto erfolgreich erstellt!").
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private nextId = 0;

  readonly toasts = signal<Toast[]>([]);

  public success(message: string): void {
    this.show(message, 'success');
  }

  public error(message: string): void {
    this.show(message, 'error');
  }

  /**
   * Marks a toast as leaving so its slide-out animation can play; the toast
   * is only removed from the list once that animation finishes (see
   * ToastContainerComponent's `(animationend)` handler).
   */
  public requestDismiss(id: number): void {
    this.toasts.update((toasts) => toasts.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)));
  }

  public dismiss(id: number): void {
    this.toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private show(message: string, variant: ToastVariant): void {
    const id = this.nextId++;
    this.toasts.update((toasts) => [...toasts, { id, message, variant, leaving: false }]);
    setTimeout(() => this.requestDismiss(id), TOAST_DURATION_MS);
  }
}
