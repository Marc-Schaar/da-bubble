import { inject, Injectable } from '@angular/core';
import { User } from '../models/user';
import { Router } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, onSnapshot } from '@angular/fire/firestore';
import { BehaviorSubject, Subject } from 'rxjs';
import { DirectMessagesComponent } from './direct-messages/direct-messages.component';
import { ChatContentComponent } from './chat-content/chat-content.component';
import { FireServiceService } from './fire-service.service';
@Injectable({
  providedIn: 'root',
})
export class UserService {
  dashboard = false;
  login = false;
  constructor(private router: Router) {
    this.setCurrentUser();
  }
  auth: Auth = inject(Auth);
  firestore: Firestore = inject(Firestore);
  fireService: FireServiceService = inject(FireServiceService);
  user: any = new User();
  public users: any[] = [];
  private indexSource = new BehaviorSubject<number>(-1);
  currentIndex$ = this.indexSource.asObservable();
  private currentComponent = new BehaviorSubject<any>(DirectMessagesComponent);
  component$ = this.currentComponent.asObservable();
  private threadToggleSubject = new Subject<void>();
  threadToggle$ = this.threadToggleSubject.asObservable();
  currentReciever: any;
  currentUser: any;
  component: string = '';
  private startLoadingChat = new Subject<void>();
  startLoadingChat$ = this.startLoadingChat.asObservable();
  private startLoadingChannel = new Subject<void>();
  startLoadingChannel$ = this.startLoadingChannel.asObservable();
  channels: any = [];
  currentChannel: any;

  messages: any = [];

  unsubChannels!: () => void;
  unsubMessages!: () => void;

  setUser(user: User) {
    this.user = user;
  }

  getUser(): User {
    return this.user;
  }

  async setOnlineStatus() {
    const currentUser = this.getUser();
    currentUser.online = true;
    console.log(currentUser);
    await this.fireService.updateOnlineStatus(currentUser);
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
