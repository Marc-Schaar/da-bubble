import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, fromEvent, map, startWith } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { NewmessageComponent } from '../../newmessage/newmessage.component';
import { DirectmessagesComponent } from '../../direct-messages/direct-messages.component';
import { ChatContentComponent } from '../../chat-content/chat-content.component';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private currentComponent = new BehaviorSubject<any>(NewmessageComponent);
  component$ = this.currentComponent.asObservable();
  private screenWidthSubject = new BehaviorSubject<boolean>(this.checkScreenWidth());
  screenWidth$ = this.screenWidthSubject.asObservable();
  isMobile: boolean = this.checkScreenWidth();
  reciverId: string = '';
  currentUserId: string = '';
  messageId: string = '';
  channelType: 'direct' | 'channel' | 'newMessage' | 'default' = 'default';

  /**
   * The constructor sets up observables for screen width changes, subscribes to route query parameters,
   * and manages component navigation based on the current channel type and screen size.
   */
  constructor() {
    this.observeScreenWidth();
    this.route.queryParams.subscribe((params) => {
      this.channelType = params['channelType'] || 'default';
      this.reciverId = params['reciverId'] || '';
      this.currentUserId = params['currentUserId'] || '';
      this.messageId = params['messageId'] || '';
      if (this.channelType === 'direct') this.showDirect();
      else if (this.channelType === 'channel') this.showChannel();
      else if (this.channelType === 'newMessage') this.showNewMessage();
      else if (this.channelType === 'default' && this.isMobile) this.router.navigate(['/contactbar']);
    });
    this.screenWidth$.subscribe((mobile) => {
      this.isMobile = mobile;
      if (mobile) {
        if (this.channelType === 'direct') this.showDirect();
        if (this.channelType === 'channel') this.showChannel();
        if (this.channelType === 'newMessage') this.showNewMessage();
        if (this.channelType === 'default') this.router.navigate(['/contactbar']);
      } else this.showChat();
    });
  }

  /**
   * Navigates to the appropriate chat view based on the channel type.
   */
  private showChat() {
    switch (this.channelType) {
      case 'direct':
        this.router.navigate(['/chat'], {
          queryParams: {
            channelType: 'direct',
            reciverId: this.reciverId,
            currentUserId: this.currentUserId,
          },
        });
        break;
      case 'channel':
        this.router.navigate(['/chat'], {
          queryParams: {
            channelType: 'channel',
            reciverId: this.reciverId,
            currentUserId: this.currentUserId,
          },
        });
        break;
      case 'newMessage':
        this.router.navigate(['/chat'], {
          queryParams: {
            channelType: 'newMessage',
          },
        });
        break;
      default:
        this.router.navigate(['/chat']);
        break;
    }
  }

  /**
   * Displays the direct message view based on the screen size.
   */
  public showDirect(): void {
    if (this.isMobile) {
      this.router.navigate(['/direct'], {
        queryParams: {
          channelType: 'direct',
          reciverId: this.reciverId,
          currentUserId: this.currentUserId,
        },
      });
    } else this.currentComponent.next(DirectmessagesComponent);
  }

  /**
   * Displays the channel view based on the screen size.
   */
  public showChannel(): void {
    if (this.isMobile) {
      this.router.navigate(['/channel'], {
        queryParams: {
          channelType: 'channel',
          reciverId: this.reciverId,
          currentUserId: this.currentUserId,
        },
      });
    } else this.currentComponent.next(ChatContentComponent);
  }

  /**
   * Displays the new message view based on the screen size.
   */
  public showNewMessage(): void {
    if (this.isMobile) {
      this.router.navigate(['/new-message'], {
        queryParams: {
          channelType: 'newMessage',
        },
      });
    } else this.currentComponent.next(NewmessageComponent);
  }

  /**
   * Observes screen width changes and updates the screenWidthSubject.
   */
  private observeScreenWidth(): void {
    fromEvent(window, 'resize')
      .pipe(
        map(() => this.checkScreenWidth()),
        distinctUntilChanged(),
        startWith(this.checkScreenWidth())
      )
      .subscribe(this.screenWidthSubject);
  }

  /**
   * Checks if the screen width is less than 1024px.
   * @returns {boolean} - True if the screen width is less than 1024px, otherwise false.
   */
  private checkScreenWidth(): boolean {
    return window.innerWidth < 1024;
  }
}
