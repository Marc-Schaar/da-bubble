import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, onSnapshot } from '@angular/fire/firestore';
import { BehaviorSubject, Subject } from 'rxjs';
import { FireServiceService } from './fire-service.service';
import { User } from './models/user';
import { NavigationService } from './service/navigation/navigation.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private route: ActivatedRoute) {
    this.setCurrentUser();
    this.getChannels();
    this.getUsers();
  }

  auth: Auth = inject(Auth);
  firestore: Firestore = inject(Firestore);
  fireService: FireServiceService = inject(FireServiceService);
  router: Router = inject(Router);
  navigationService: NavigationService = inject(NavigationService);

  dashboard: boolean = false;
  login: boolean = false;

  private indexSource = new BehaviorSubject<number>(-1);
  currentIndex$ = this.indexSource.asObservable();

  private contactbarToggleSubject = new Subject<void>();
  contactbarSubscription$ = this.contactbarToggleSubject.asObservable();

  private threadToggleSubject = new Subject<string>();
  threadToggle$ = this.threadToggleSubject.asObservable();

  private openProfile = new Subject<void>();
  openProfile$ = this.openProfile.asObservable();

  private showFeedbackSubject = new Subject<string>();
  showFeedback$ = this.showFeedbackSubject.asObservable();

  currentReciever: any;
  public users: any = [];
  channels: any = [];
  messages: any = [];

  currentChannel: any;

  //Neu ab hier

  messageId: string = '';
  currentUser: any;
  userId: string = '';

  setUser(user: User) {
    this.currentUser = user;
  }

  getUser(): User {
    return this.currentUser;
  }

  async setOnlineStatus() {
    const currentUser = this.getUser();
    currentUser.online = true;
    await this.fireService.updateOnlineStatus(currentUser);
  }

  redirectiontodashboard() {
    this.navigationService.isMobile ? this.router.navigate(['/contactbar']) : this.router.navigate(['/chat']);
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
        this.currentUser = user;
        this.userId = user.uid;
      } else {
        this.currentUser = new User(null);
      }
    });
  }

  getChannels() {
    let channelRef = this.fireService.getCollectionRef('channels');
    this.channels = [];
    if (channelRef) {
      onSnapshot(channelRef, (colSnap) => {
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

  async getChannel(channel: any, user: any) {
    this.currentChannel = channel;
    this.currentUser = user;
  }

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

  toggleThread(value: string) {
    this.threadToggleSubject.next(value);
  }

  toggleContactbar() {
    this.contactbarToggleSubject.next();
  }

  checkScreenWidth(): boolean {
    return window.innerWidth < 1024;
  }

  showRecieverProfile() {
    this.openProfile.next();
  }

  showFeedback(message: string) {
    this.showFeedbackSubject.next(message);
  }
}
