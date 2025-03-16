import { inject, Injectable } from '@angular/core';
import { User } from '../models/user';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { DirectMessagesComponent } from './direct-messages/direct-messages.component';
import { Firestore, onSnapshot } from '@angular/fire/firestore';
import { FireServiceService } from './fire-service.service';
import { ChatContentComponent } from './chat-content/chat-content.component';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class ChatServiceService {
  constructor() {}

  auth: Auth = inject(Auth);
  router: Router = inject(Router);
  fireService: FireServiceService = inject(FireServiceService);

  login = false;
  dashboard = false;

  user: any = new User();

  private currentComponent = new BehaviorSubject<any>(DirectMessagesComponent);
  component$ = this.currentComponent.asObservable();
  private startLoadingChat = new Subject<void>();
  startLoadingChat$ = this.startLoadingChat.asObservable();
  private startLoadingChannel = new Subject<void>();
  startLoadingChannel$ = this.startLoadingChannel.asObservable();
  private threadToggleSubject = new Subject<void>();
  threadToggle$ = this.threadToggleSubject.asObservable();

  channels: any = [];

  currentReciever: any;
  currentUser: any;
  currentChannel: any;
  unsubChannels!: () => void;
  unsubMessages!: () => void;

  setUser(user: User) {
    this.user = user;
  }

  getUser(): User {
    return this.user;
  }

  setCurrentUser() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.user = user;
        console.log('User is still logged in:', user);
      } else {
        this.user = new User(null);
        console.log('User is logged out');
      }
    });
  }

  redirectiontodashboard() {
    this.router.navigate(['/chat']);
  }

  redirectiontologinpage() {
    this.router.navigate(['/main']);
  }
  continue() {
    this.router.navigate(['/avatarselection']);
  }

  getChannels() {
    this.channels = [];
    this.unsubChannels = onSnapshot(
      this.fireService.getCollectionRef('channels')!,
      (colSnap) => {
        this.channels = colSnap.docs.map((colSnap) => ({
          key: colSnap.id,
          data: colSnap.data(),
        }));
        this.currentChannel = this.channels[0];
      }
    );
  }

  getReciepent(reciever: any, user: any) {
    this.currentReciever = reciever;
    this.currentUser = user;
    this.startLoadingChat.next();
  }

  getChannel(channel: any, user: any) {
    this.currentChannel = channel;
    this.currentUser = user;
    this.startLoadingChannel.next();
  }

  loadComponent(component: string) {
    //this.currentComponent.next(null);
    setTimeout(() => {
      if (component === 'chat') {
        this.currentComponent.next(DirectMessagesComponent);
      } else if (component === 'channel') {
        this.currentComponent.next(ChatContentComponent);
      }
    }, 0);
  }

  toggleThread() {
    this.threadToggleSubject.next();
  }
}
