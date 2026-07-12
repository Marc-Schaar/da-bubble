import { inject, Injectable, signal } from '@angular/core';
import { distinctUntilChanged, filter, fromEvent, map } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private router = inject(Router);

  public isAuthPage = signal<boolean>(true);
  public isContactbarPage = signal<boolean>(true);
  public isMainChat = signal<boolean>(true);
  public isMobile = signal<boolean>(this.checkScreenWidth());
  public isChannelsOpen = signal<boolean>(true); // Default offen
  public isDirectMessagesOpen = signal<boolean>(false);
  public isThreadOpen = signal<boolean>(false);

  /**
   * The constructor sets up observables for screen width changes, subscribes to route query parameters,
   * and manages component navigation based on the current channel type and screen size.
   */
  constructor() {
    this.checkCurrentUrl(this.router.url);
    this.observeScreenWidth();

    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
      this.checkCurrentUrl(event.urlAfterRedirects);
    });
  }

  public gotToAvatarSelection() {
    this.router.navigate(['register/avatar']);
  }

  /**
   * Redirects to the dashboard or contact bar based on the device type.
   */
  public gotToChat() {
    this.router.navigate(['/main']);

    if (!this.isMobile()) {
      this.router.navigate(['/main/new-message']);
    }
  }

  /**
   * Opens the thread panel for a message by putting its id into the query
   * params (read by ThreadComponent) and opening the thread drawer.
   */
  public goToThread(messageId: string, channelId: string) {
    this.isThreadOpen.set(true);
    this.router.navigate([], {
      queryParams: { messageId: messageId, reciverId: channelId },
      queryParamsHandling: 'merge',
    });
  }

  public goToLogin() {
    this.router.navigate(['login']);
  }

  private checkCurrentUrl(url: string) {
    const isChannelRoute = url.includes('channel/');
    const isDirectRoute = url.includes('direct/');

    if (isChannelRoute) {
      this.isChannelsOpen.set(true);
      this.isDirectMessagesOpen.set(false);
    }
    if (isDirectRoute) {
      this.isDirectMessagesOpen.set(true);
      this.isChannelsOpen.set(false);
    }
    this.isThreadOpen.set(url.includes('messageId='));
    const isAuth = url.includes('login') || url.includes('register');
    const isContactbar = url.includes('contactbar');
    const path = url.split('?')[0];
    const isMain = path === '/main' || path === '/main/';
    this.isAuthPage.set(isAuth);
    this.isContactbarPage.set(isContactbar);
    this.isMainChat.set(isMain);
  }

  public selectChannel(id: string) {
    this.isThreadOpen.set(false);
    this.router.navigate(['/main/channel', id]);
  }

  public selectDirectMessageRecipient(id: string) {
    this.isThreadOpen.set(false);
    this.router.navigate(['/main/direct', id]);
  }

  goBackToList() {
    this.goToNewMessage();
  }

  public goToNewMessage() {
    this.router.navigate(['/main/new-message']);
  }
  /**
   * Observes screen width changes and updates the isMobile signal.
   */
  private observeScreenWidth(): void {
    fromEvent(window, 'resize')
      .pipe(
        map(() => this.checkScreenWidth()),
        distinctUntilChanged(),
      )
      .subscribe((isMobileNow) => {
        this.isMobile.set(isMobileNow);
        if (!isMobileNow && this.router.url === '/main') {
          this.router.navigate(['/main/new-message']);
        }
      });
  }

  /**
   * Checks if the screen width is less than 1024px.
   * @returns {boolean} - True if the screen width is less than 1024px, otherwise false.
   */
  private checkScreenWidth(): boolean {
    return window.innerWidth < 1024;
  }

  /**
   * Opens or closes the thread drawer; closing also removes the messageId
   * query param so a reload does not restore a stale thread.
   */
  public toggleThread(action: 'open' | 'close') {
    if (action === 'close') {
      this.isThreadOpen.set(false);
      this.router.navigate([], {
        queryParams: { messageId: null },
        queryParamsHandling: 'merge',
      });
    } else {
      this.isThreadOpen.set(true);
    }
  }
}
