import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, filter, fromEvent, map, startWith, Subject, Subscription } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private router = inject(Router);

  private screenWidthSubject = new BehaviorSubject<boolean>(this.checkScreenWidth());
  screenWidth$ = this.screenWidthSubject.asObservable();
  private screenWidthSubscription?: Subscription;
  private resizeSubscription?: Subscription;

  public isAuthPage = signal<boolean>(true);
  public isContactbarPage = signal<boolean>(true);
  public showContent = signal(true);
  public isMobile = signal<boolean>(this.checkScreenWidth());

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
    if (this.isMobile()) {
      this.router.navigate(['/main']);
    } else {
      this.router.navigate(['/main/new-message']);
    }
  }

  public goToLogin() {
    this.router.navigate(['login']);
  }

  private checkCurrentUrl(url: string) {
    const isAuth = url.includes('login') || url.includes('register');
    const isContactbar = url.includes('contactbar');
    this.isAuthPage.set(isAuth);
    this.isContactbarPage.set(isContactbar);
  }

  selectChannel(id: string) {
    this.showContent.set(true);
    this.router.navigate(['/main/channel', id]);
  }

  goBackToList() {
    this.showContent.set(false);
    this.router.navigate(['/main/new-message']);
  }

  /**
   * Observes screen width changes and updates the screenWidthSubject.
   */
  private observeScreenWidth(): void {
    fromEvent(window, 'resize')
      .pipe(
        map(() => this.checkScreenWidth()),
        distinctUntilChanged(),
      )
      .subscribe((isMobileNow) => {
        this.isMobile.set(isMobileNow);
        console.log('Mobile Mode:', isMobileNow);
      });
  }

  /**
   * Checks if the screen width is less than 1024px.
   * @returns {boolean} - True if the screen width is less than 1024px, otherwise false.
   */
  private checkScreenWidth(): boolean {
    return window.innerWidth < 1024;
  }

  public setUrl(a: any, b: any, c?: any) {
    console.log('test');
  }

  public showChannel() {}

  public showDirect() {}

  public showNewMessage() {}
  public toggleThread(a: any) {}
}
