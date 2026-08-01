import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService, Toast } from '../../services/notification/notification.service';

/**
 * Renders the app's slide-in toasts. Mounted once at the app root so toasts
 * survive route changes and stack above every page.
 */
@Component({
  selector: 'app-toast-container',
  imports: [],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  private readonly notificationService = inject(NotificationService);

  protected readonly toasts = this.notificationService.toasts;

  protected dismiss(id: number): void {
    this.notificationService.requestDismiss(id);
  }

  /**
   * The entrance animation also fires `animationend`, so only remove the
   * toast once its slide-out ("leaving") animation is the one that finished.
   */
  protected onAnimationEnd(toast: Toast): void {
    if (toast.leaving) {
      this.notificationService.dismiss(toast.id);
    }
  }
}
