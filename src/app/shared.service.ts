import { inject, Injectable, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, onSnapshot } from '@angular/fire/firestore';
import { BehaviorSubject, distinctUntilChanged, fromEvent, map, startWith, Subject, Subscription } from 'rxjs';
import { DirectmessagesComponent } from './direct-messages/direct-messages.component';
import { ChatContentComponent } from './chat-content/chat-content.component';
import { FireServiceService } from './fire-service.service';
import { User } from './models/user';
import { NewmessageComponent } from './newmessage/newmessage.component';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private route: ActivatedRoute) {
    this.setCurrentUser();
    // this.getCurrentChannel();
    this.observeScreenWidth();
    this.getUrlData();
    this.getChannels();
    this.getUsers();
    this.subscription = this.screenWidth$.subscribe((isMobile) => {
      this.isMobile = isMobile;
      console.log('Ist Mobile Ansicht aktiv?:', this.isMobile);
    });
  }

  auth: Auth = inject(Auth);
  firestore: Firestore = inject(Firestore);
  fireService: FireServiceService = inject(FireServiceService);
  router: Router = inject(Router);

  dashboard: boolean = false;
  login: boolean = false;
  isMobile: boolean = false;

  private indexSource = new BehaviorSubject<number>(-1);
  currentIndex$ = this.indexSource.asObservable();
  private currentComponent = new BehaviorSubject<any>(NewmessageComponent);

  component$ = this.currentComponent.asObservable();
  private startLoadingChat = new Subject<void>();
  startLoadingChat$ = this.startLoadingChat.asObservable();
  private startLoadingChannel = new Subject<void>();
  startLoadingChannel$ = this.startLoadingChannel.asObservable();

  private threadToggleSubject = new Subject<void>();
  threadToggle$ = this.threadToggleSubject.asObservable();
  private openProfile = new Subject<void>();
  openProfile$ = this.openProfile.asObservable();
  private screenWidthSubject = new BehaviorSubject<boolean>(this.checkScreenWidth());
  screenWidth$ = this.screenWidthSubject.asObservable();
  private isProfileCardSubject = new BehaviorSubject<boolean>(false);
  isProfileCard$ = this.isProfileCardSubject.asObservable();
  subscription: Subscription;
  currentReciever: any;

  component: string = '';

  public users: any[] = [];
  channels: any = [];
  messages: any = [];

  user: any = new User(null);
  userId: string = '';
  currentUser: any;
  currentChannel: any;

  //Neu ab hier

  channelType: any;
  docId: any;
  reciepentId: any;
  messageId: string = '';

  unsubChannels!: () => void;
  unsubMessages!: () => void;

  setUser(user: User) {
    this.user = user;
  }

  getUser(): User {
    return this.user;
  }

  getUserId(): string {
    return this.userId;
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

  redirectiontoavatarselection() {
    this.router.navigate(['/avatarselection']);
  }

  setCurrentUser() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.user = user;
        this.userId = user.uid;
        console.log('User is still logged in:', user);
      } else {
        this.user = new User(null);
        console.log('User is logged out');
      }
    });
  }

  getChannels() {
    this.channels = [];
    this.unsubChannels = onSnapshot(this.fireService.getCollectionRef('channels')!, (colSnap) => {
      this.channels = colSnap.docs.map((colSnap) => ({
        key: colSnap.id,
        data: colSnap.data(),
      }));
      this.currentChannel = this.channels[0];
    });
  }

  getUsers() {
    onSnapshot(this.fireService.getCollectionRef('users')!, (colSnap) => {
      this.users = colSnap.docs.map((colSnap) => ({
        key: colSnap.id,
        ...colSnap.data(),
      }));
    });
  }

  getUrlData() {
    this.route.queryParams.subscribe((params) => {
      this.channelType = params['channelType'] || 'default';
      this.docId = params['id'] || '';
      this.reciepentId = params['reciepentId'] || '';
      this.messageId = params['messageId'] || '';
    });
  }

  async getReciepent(reciever: any, user: any) {
    this.currentReciever = reciever;
    this.currentUser = user;

    //localStorage.setItem('currentReciver', JSON.stringify(reciever));
    if (this.unsubMessages) this.unsubMessages();
    await this.loadMessages();
    this.startLoadingChat.next();
  }

  async getChannel(channel: any, user: any) {
    this.currentChannel = channel;
    this.currentUser = user;
    if (this.unsubMessages) this.unsubMessages();
    await this.loadMessages();
    this.startLoadingChannel.next();
  }

  //!Wichtig verhindert doppelklick!!
  async loadMessages() {
    return new Promise<void>((resolve) => {
      this.unsubMessages = onSnapshot(this.fireService.getCollectionRef(`${this.channelType}/${this.docId}/messages`)!, (colSnap) => {
        this.messages = colSnap.docs.map((colSnap) => colSnap.data());
        resolve();
      });
    });
  }

  // getCurrentChannel() {
  //   let storedChannel = localStorage.getItem('currentChannel');
  //   if (storedChannel) this.currentChannel = JSON.parse(storedChannel);
  //   else console.log('Channel konnte nicht geladen werden aus Local Storage');
  // }

  setUrl(channelType: string, id?: string, reciepentId?: string, messageId?: string) {
    this.router.navigate(['/chat'], {
      queryParams: {
        channelType: channelType,
        id: id,
        reciepentId: reciepentId,
        messageId: messageId,
      },
    });
  }

  loadComponent(component: string) {
    setTimeout(() => {
      if (component === 'chat') {
        if (this.isMobile)
          this.router.navigate(['/direct'], {
            queryParams: { channelType: 'direct', id: this.docId, reciepentId: this.reciepentId }, //Muss noch überprüft werden
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

  showRecieverProfile() {
    this.openProfile.next();
  }

  setProfileCardState(state: boolean) {
    this.isProfileCardSubject.next(state);
  }
}
