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
  channelType: 'direct' | 'channel' | 'default' = 'default';

  constructor() {
    this.observeScreenWidth();
    this.screenWidth$.subscribe((mobile) => {
      this.isMobile = mobile;
      console.log('Screen width changed:', mobile);
      console.log('Current channel type:', this.channelType);

      if (mobile) {
        this.router.navigate(['/contactbar']);
        if (this.channelType === 'direct') {
          this.showDirect();
        }
        if (this.channelType === 'channel') {
          this.showChannel();
        }
      } else {
        this.router.navigate(['/chat']);
        if (this.channelType === 'direct') {
          this.router.navigate(['/chat'], {
            queryParams: {
              channelType: 'direct',
              id: this.docId,
              reciepentId: this.reciepentId,
            },
          });
        }
        if (this.channelType === 'channel') {
          this.router.navigate(['/chat'], {
            queryParams: {
              channelType: 'channel',
              id: this.docId,
              reciepentId: this.reciepentId,
            },
          });
        }
      }
    });

    this.route.queryParams.subscribe((params) => {
      this.channelType = params['channelType'] || 'default';
      this.docId = params['id'] || '';
      this.reciepentId = params['reciepentId'] || '';
      this.messageId = params['messageId'] || '';

      if (this.channelType === 'direct') {
        this.showDirect();
      } else if (this.channelType === 'channel') {
        this.showChannel();
      }
      // else if (!this.isMobile) {
      //   this.router.navigate(['/chat']);
      //}
      else if (this.channelType === 'default' && this.isMobile) {
        this.router.navigate(['/contactbar']);
      }
      // else {
      //   this.router.navigate(['/chat']);
      // }
    });
  }

  showDirect(): void {
    if (this.isMobile) {
      this.router.navigate(['/direct'], {
        queryParams: {
          channelType: 'direct',
          id: this.docId,
          reciepentId: this.reciepentId,
        },
      });
    } else {
      this.currentComponent.next(DirectmessagesComponent);
    }
  }

  showChannel(): void {
    if (this.isMobile) {
      this.router.navigate(['/channel'], {
        queryParams: {
          channelType: 'channel',
          id: this.docId,
          reciepentId: this.reciepentId,
        },
      });
    } else {
      this.currentComponent.next(ChatContentComponent);
    }
  }

  // showMainChat(): void {
  //   this.router.navigate(['/chat'], {
  //     queryParams: {
  //       channelType: 'default',
  //       id: this.docId,
  //       reciepentId: this.reciepentId,
  //     },
  //   });
  //   this.currentComponent.next(MainChatComponent);
  // }

  /**
   * Überwacht Änderungen der Fenstergröße und pusht neue Werte in das Subject
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
   * Prüft, ob wir im Mobile-Layout sind (Breite < 1024px)
   */
  private checkScreenWidth(): boolean {
    return window.innerWidth < 1024;
  }
}
