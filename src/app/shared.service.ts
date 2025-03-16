import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, onSnapshot } from '@angular/fire/firestore';
import {
  BehaviorSubject,
  distinctUntilChanged,
  fromEvent,
  map,
  startWith,
  Subject,
} from 'rxjs';
import { DirectmessagesComponent } from './direct-messages/direct-messages.component';
import { ChatContentComponent } from './chat-content/chat-content.component';
import { FireServiceService } from './fire-service.service';
import { User } from './models/user';
@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor() {
    this.setCurrentUser();
    this.observeScreenWidth();
  }

  auth: Auth = inject(Auth);
  firestore: Firestore = inject(Firestore);
  fireService: FireServiceService = inject(FireServiceService);
  router: Router = inject(Router);

  dashboard: boolean = false;
  login: boolean = false;

  private indexSource = new BehaviorSubject<number>(-1);
  currentIndex$ = this.indexSource.asObservable();
  private currentComponent = new BehaviorSubject<any>(DirectmessagesComponent);
  component$ = this.currentComponent.asObservable();
  private startLoadingChat = new Subject<void>();
  startLoadingChat$ = this.startLoadingChat.asObservable();
  private startLoadingChannel = new Subject<void>();
  startLoadingChannel$ = this.startLoadingChannel.asObservable();
  private threadToggleSubject = new Subject<void>();
  threadToggle$ = this.threadToggleSubject.asObservable();

  private screenWidthSubject = new BehaviorSubject<boolean>(
    this.checkScreenWidth()
  );
  screenWidth$ = this.screenWidthSubject.asObservable();
  currentReciever: any;

  component: string = '';

  public users: any[] = [];
  channels: any = [];
  messages: any = [];

  user: any = new User();
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
        this.currentComponent.next(DirectmessagesComponent);
      } else if (component === 'channel') {
        this.currentComponent.next(ChatContentComponent);
      }
    }, 0);
  }

  toggleThread() {
    this.threadToggleSubject.next();
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
