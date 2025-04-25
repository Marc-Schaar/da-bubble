import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, fromEvent, map, startWith, Subscription } from 'rxjs';
import { NewmessageComponent } from '../../newmessage/newmessage.component';
import { ActivatedRoute, Router } from '@angular/router';
import { DirectmessagesComponent } from '../../direct-messages/direct-messages.component';
import { ChatContentComponent } from '../../chat-content/chat-content.component';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  router: Router = inject(Router);
  route: ActivatedRoute = inject(ActivatedRoute);

  private currentComponent = new BehaviorSubject<any>(NewmessageComponent);
  component$ = this.currentComponent.asObservable();

  private screenWidthSubject = new BehaviorSubject<boolean>(this.checkScreenWidth());
  screenWidth$ = this.screenWidthSubject.asObservable();

  subscription: Subscription;

  isMobile: boolean = false;

  docId: string = '';
  reciepentId: string = '';
  messageId: string = '';

  channelType: string = '';

  constructor() {
    this.subscription = this.screenWidth$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });

    this.route.queryParams.subscribe((params) => {
      this.channelType = params['channelType'] || 'default';
      this.docId = params['id'] || '';
      this.reciepentId = params['reciepentId'] || '';
      this.messageId = params['messageId'] || '';
    });
  }

  loadComponent(component: string) {
    setTimeout(() => {
      if (component === 'chat') {
        if (this.isMobile)
          this.router.navigate(['/direct'], {
            queryParams: { channelType: 'direct', id: this.docId, reciepentId: this.reciepentId },
          });
        else this.currentComponent.next(DirectmessagesComponent);
      } else if (component === 'channel') {
        if (this.isMobile)
          this.router.navigate(['/channel'], {
            queryParams: { channelType: 'channel', id: this.docId, reciepentId: this.reciepentId },
          });
        else this.currentComponent.next(ChatContentComponent);
      }
    }, 0);
  }

  checkScreenWidth(): boolean {
    return window.innerWidth < 1024;
  }

  observeScreenWidth() {
    fromEvent(window, 'resize')
      .pipe(
        map(() => this.checkScreenWidth()),
        distinctUntilChanged(),
        startWith(this.checkScreenWidth())
      )
      .subscribe(this.screenWidthSubject);
  }
}
