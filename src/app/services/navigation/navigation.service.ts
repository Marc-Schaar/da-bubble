import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, fromEvent, map, startWith, Subject, Subscription } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { NewmessageComponent } from '../../chat-new-message/chat-new.component';
import { DirectmessagesComponent } from '../../chat-direct/chat-direct.component';
import { ChatContentComponent } from '../../chat-channel/chat-channel.component';
import { UserService } from '../user/shared.service';
import { Auth } from '@angular/fire/auth';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private auth: Auth = inject(Auth);
  private currentComponent = new BehaviorSubject<any>(NewmessageComponent);
  component$ = this.currentComponent.asObservable();
  private screenWidthSubject = new BehaviorSubject<boolean>(this.checkScreenWidth());
  screenWidth$ = this.screenWidthSubject.asObservable();
  private threadToggleSubject = new Subject<string>();
  threadToggle$ = this.threadToggleSubject.asObservable();
  private queryParamsSubscription?: Subscription;
  private screenWidthSubscription?: Subscription;
  private resizeSubscription?: Subscription;
  public isMobile: boolean = this.checkScreenWidth();
  public isInitialize: boolean = false;
  public reciverId: string = '';
  public currentUserId: string = '';
  public messageId: string = '';
  public channelType: 'direct' | 'channel' | 'thread' | 'newMessage' | 'default' = 'default';
  location = inject(Location);

  /**
   * The constructor sets up observables for screen width changes, subscribes to route query parameters,
   * and manages component navigation based on the current channel type and screen size.
   */
  constructor() {}

  public initialize(): void {
    this.isInitialize = true;
    if (this.isInitialize) {
      this.observeScreenWidth();
      this.queryParamsSubscription = this.route.queryParams.subscribe((params) => {
        this.channelType = params['channelType'] || 'default';
        this.reciverId = params['reciverId'] || '';
        this.currentUserId = params['currentUserId'] || '';
        this.messageId = params['messageId'] || '';
        this.handleComponents();
      });

      this.screenWidthSubscription = this.screenWidth$.subscribe((mobile) => {
        this.isMobile = mobile;
        mobile ? this.handleComponents() : this.showChat();
      });
    } else return;
  }

  /**
   * Handles the display logic for different channel types.
   * Navigates to the contact bar on mobile if the channel type is unrecognized.
   */
  handleComponents() {
    switch (this.channelType) {
      case 'direct':
        this.showDirect();
        break;
      case 'channel':
        this.showChannel();
        break;
      case 'thread':
        this.showThread();
        break;
      case 'newMessage':
        this.showNewMessage();
        break;

      default:
        if (this.isMobile) this.showContactbar();
        break;
    }
  }

  /**
   * Navigates to the Contactbar.
   */
  public showContactbar() {
    this.router.navigate(['/contactbar']);
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
            reciverId: this.reciverId || '',
            currentUserId: this.currentUserId || '',
          },
        });
        break;

      case 'thread':
        this.router
          .navigate(['/chat'], {
            queryParams: {
              channelType: 'thread',
              reciverId: this.reciverId,
              currentUserId: this.currentUserId || '',
              messageId: this.messageId || '',
            },
          })
          .then(() => {
            this.showChannel();
            this.toggleThread('open');
          });

        break;

      case 'channel':
        this.router.navigate(['/chat'], {
          queryParams: {
            channelType: 'channel',
            reciverId: this.reciverId || '',
            currentUserId: this.currentUserId || '',
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
          reciverId: this.reciverId || '',
          currentUserId: this.currentUserId || '',
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
          reciverId: this.reciverId || '',
          currentUserId: this.currentUserId || '',
          messageId: this.messageId || '',
        },
      });
    } else this.currentComponent.next(ChatContentComponent);
  }

  /**
   * Displays the Thread view based on the screen size.
   */
  public showThread() {
    if (this.isMobile) {
      this.router.navigate(['/thread'], {
        queryParams: {
          channelType: 'thread',
          reciverId: this.reciverId || '',
          currentUserId: this.currentUserId || '',
          messageId: this.messageId || '',
        },
      });
    } else this.toggleThread('open');
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
    this.resizeSubscription = fromEvent(window, 'resize')
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

  public stopInitialize(): void {
    this.isInitialize = false;
    this.queryParamsSubscription?.unsubscribe();
    this.screenWidthSubscription?.unsubscribe();
    this.resizeSubscription?.unsubscribe();
  }

  /**
   * Toggles the thread view by emitting a value.
   * @param value The value to emit for the thread toggle.
   */
  toggleThread(value: string) {
    this.threadToggleSubject.next(value);
  }

  /**
   * Navigates to the previous location in the browser history.
   */
  back() {
    this.location.back();
  }

  /**
   * Sets the URL with the provided parameters.
   * @param channelType The type of the channel.
   * @param id The channel id.
   * @param reciepentId The recipient id.
   * @param messageId The message id.
   */
  setUrl(channelType: string, reciverId?: string, currentUserId?: string, messageId?: string) {
    this.router.navigate(['/chat'], {
      queryParams: {
        channelType: channelType,
        reciverId: reciverId,
        currentUserId: currentUserId,
        messageId: messageId,
      },
    });
  }
}
