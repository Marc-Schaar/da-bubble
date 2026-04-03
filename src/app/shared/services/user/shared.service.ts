import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor() {}

  showFeedback(a: any) {}
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
