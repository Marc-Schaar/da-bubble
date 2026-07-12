import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  public readonly feedbackMessage = signal<string | null>(null);
  private feedbackTimeout?: ReturnType<typeof setTimeout>;

  /**
   * Shows a short-lived feedback message (rendered by MainChatComponent).
   * @param message - The message to display.
   */
  showFeedback(message: string): void {
    clearTimeout(this.feedbackTimeout);
    this.feedbackMessage.set(message);
    this.feedbackTimeout = setTimeout(() => this.feedbackMessage.set(null), 2000);
  }

  /**
   * Scrolls the chat content area to the bottom.
   */
  scrollToBottom(ref: HTMLElement | null): void {
    if (!ref) return;
    setTimeout(() => {
      ref.scrollTop = ref.scrollHeight;
    }, 0);
  }
}
