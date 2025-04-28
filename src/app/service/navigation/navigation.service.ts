import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, fromEvent, map, startWith } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { NewmessageComponent } from '../../newmessage/newmessage.component';
import { DirectmessagesComponent } from '../../direct-messages/direct-messages.component';
import { ChatContentComponent } from '../../chat-content/chat-content.component';
import { MainChatComponent } from '../../main-chat/main-chat.component';

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

  docId: string = '';
  reciepentId: string = '';
  messageId: string = '';
  channelType: 'direct' | 'channel' | 'newMessage' | 'default' = 'default';

  constructor() {
    this.observeScreenWidth();

    this.route.queryParams.subscribe((params) => {
      this.channelType = params['channelType'] || 'default';
      this.docId = params['id'] || '';
      this.reciepentId = params['reciepentId'] || '';
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

  private showChat() {
    switch (this.channelType) {
      case 'direct':
        this.router.navigate(['/chat'], {
          queryParams: {
            channelType: 'direct',
            id: this.docId,
            reciepentId: this.reciepentId,
          },
        });
        break;

      case 'channel':
        this.router.navigate(['/chat'], {
          queryParams: {
            channelType: 'channel',
            id: this.docId,
            reciepentId: this.reciepentId,
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

  public showDirect(): void {
    if (this.isMobile) {
      this.router.navigate(['/direct'], {
        queryParams: {
          channelType: 'direct',
          id: this.docId,
          reciepentId: this.reciepentId,
        },
      });
    } else this.currentComponent.next(DirectmessagesComponent);
  }

  public showChannel(): void {
    if (this.isMobile) {
      this.router.navigate(['/channel'], {
        queryParams: {
          channelType: 'channel',
          id: this.docId,
          reciepentId: this.reciepentId,
        },
      });
    } else this.currentComponent.next(ChatContentComponent);
  }

  public showNewMessage(): void {
    if (this.isMobile) {
      this.router.navigate(['/new-message'], {
        queryParams: {
          channelType: 'newMessage',
        },
      });
    } else this.currentComponent.next(NewmessageComponent);
  }

  private observeScreenWidth(): void {
    fromEvent(window, 'resize')
      .pipe(
        map(() => this.checkScreenWidth()),
        distinctUntilChanged(),
        startWith(this.checkScreenWidth())
      )
      .subscribe(this.screenWidthSubject);
  }

  private checkScreenWidth(): boolean {
    return window.innerWidth < 1024;
  }
}
