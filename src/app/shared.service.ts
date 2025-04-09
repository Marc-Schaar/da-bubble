import { inject, Injectable, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, onSnapshot, serverTimestamp } from '@angular/fire/firestore';
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

  private threadToggleSubject = new Subject<string>();
  threadToggle$ = this.threadToggleSubject.asObservable();
  private openProfile = new Subject<void>();
  openProfile$ = this.openProfile.asObservable();
  private screenWidthSubject = new BehaviorSubject<boolean>(this.checkScreenWidth());
  screenWidth$ = this.screenWidthSubject.asObservable();
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
    await this.fireService.updateOnlineStatus(currentUser);
  }

  redirectiontodashboard() {
    this.isMobile ? this.router.navigate(['/contactbar']) : this.router.navigate(['/chat']);
  }

  redirectiontologinpage() {
    this.router.navigate(['/']);
  }

  redirectiontoavatarselection() {
    this.router.navigate(['/avatarselection']);
  }

  setCurrentUser() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.user = user;
        this.userId = user.uid;
      } else {
        this.user = new User(null);
      }
    });
  }

  getChannels() {
    let channelRef = this.fireService.getCollectionRef('channels');
    this.channels = [];
    if (channelRef) {
      this.unsubChannels = onSnapshot(channelRef, (colSnap) => {
        this.channels = colSnap.docs.map((colSnap) => ({
          key: colSnap.id,
          data: colSnap.data(),
        }));
        this.currentChannel = this.channels[0];
      });
    }
  }

  getUsers() {
    let userRef = this.fireService.getCollectionRef('users');
    if (userRef) {
      onSnapshot(userRef, (colSnap: any) => {
        this.users = colSnap.docs.map((colSnap: any) => ({
          key: colSnap.id,
          ...colSnap.data(),
        }));
      });
    }
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
    if (this.docId && this.channelType === 'channel') {
      return new Promise<void>((resolve) => {
        this.unsubMessages = onSnapshot(this.fireService.getCollectionRef(`channel/${this.docId}/messages`)!, (colSnap) => {
          this.messages = colSnap.docs.map((colSnap) => colSnap.data());
          resolve();
        });
      });
    }
    if (this.docId && this.channelType === 'direct') {
      return new Promise<void>((resolve) => {
        this.unsubMessages = onSnapshot(this.fireService.getCollectionRef(`direct/${this.docId}/messages`)!, (colSnap) => {
          this.messages = colSnap.docs.map((colSnap) => colSnap.data());
          resolve();
        });
      });
    }
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

  toggleThread(value: string) {
    this.threadToggleSubject.next(value);
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

  isNewDay(messages: any): boolean {
    if (messages.length === 0) return true;
    let lastMessage = messages[messages.length - 1];
    let lastMessageDate = lastMessage.date;
    let todayDate = new Date().toISOString().split('T')[0];
    return lastMessageDate !== todayDate;
  }

  isToday(date: any): boolean {
    if (!date) return false;
    let today = new Date().toISOString().split('T')[0];
    let messageDate = new Date(date).toISOString().split('T')[0];
    return today === messageDate;
  }

  buildMessageObject(input: string, messages: any, reactions: any): {} {
    return {
      message: input || '',
      avatar: this.user?.photoURL || '',
      date: new Date().toISOString().split('T')[0],
      name: this.user?.displayName || 'Unbekannt',
      newDay: this.isNewDay(messages),
      timestamp: serverTimestamp(),
      reaction: reactions || [],
    };
  }

  processData(snap: any) {
    return snap.docs.map((doc: any) => {
      let data = doc.data();

      return {
        id: doc.id,
        ...data,
        time: data['timestamp']
          ? new Date(data['timestamp'].toDate()).toLocaleTimeString('de-DE', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '–',
      };
    });
  }
}
