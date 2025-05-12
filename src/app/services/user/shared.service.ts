import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, onSnapshot } from '@angular/fire/firestore';
import { BehaviorSubject, Subject } from 'rxjs';
import { FireServiceService } from '../firebase/fire-service.service';
import { NavigationService } from '../navigation/navigation.service';
import { User } from '../../models/user/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
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

  public currentUser: any;

  constructor(private route: ActivatedRoute) {
    this.setCurrentUser();
    this.getChannels();
    this.getUsers();
  }

  /**
   * Sets the current user.
   * @param user The user to set as the current user.
   */
  setUser(user: User) {
    this.currentUser = user;
  }

  /**
   * Retrieves the current user.
   * @returns The current user.
   */
  getUser(): User {
    return this.currentUser;
  }

  /**
   * Sets the online status of the current user.
   * Updates the online status in Firestore.
   */
  async setOnlineStatus() {
    const currentUser = this.getUser();
    currentUser.online = true;
    await this.fireService.updateOnlineStatus(currentUser);
  }

  /**
   * Redirects to the dashboard or contact bar based on the device type.
   */
  redirectiontodashboard() {
    this.navigationService.isMobile ? this.router.navigate(['/contactbar']) : this.router.navigate(['/chat']);
    if (!this.navigationService.isInitialize) {
      this.navigationService.initialize();
    }
  }

  /**
   * Redirects to the login page.
   */
  redirectiontologinpage() {
    this.router.navigate(['/']);
    this.navigationService.stopInitialize();
  }

  /**
   * Redirects to the avatar selection page.
   */
  redirectiontoavatarselection() {
    this.router.navigate(['/avatarselection']);
  }

  /**
   * Sets the current user by subscribing to the auth state.
   * Retrieves the user from Firebase authentication.
   */
  setCurrentUser() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.currentUser = {
          id: user.uid,
          ...user,
        };
      } else {
        this.currentUser = new User(null);
      }
    });
  }

  /**
   * Fetches channels from Firestore and sets the current channel.
   */
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

  /**
   * Fetches users from Firestore and sets the users array.
   */
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

  /**
   * Sets the current channel and user.
   * @param channel The channel to set.
   * @param user The user to set.
   */
  async getChannel(channel: any, user: any) {
    this.currentChannel = channel;
    this.currentUser = user;
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

  /**
   * Toggles the contact bar view.
   */
  toggleContactbar() {
    this.contactbarToggleSubject.next();
  }

  /**
   * Shows the receiver's profile by emitting an event.
   */
  showRecieverProfile() {
    this.openProfile.next();
  }

  /**
   * Displays feedback by emitting a message.
   * @param message The message to display as feedback.
   */
  showFeedback(message: string) {
    this.showFeedbackSubject.next(message);
  }

  /**
   * Scrolls the chat content area to the bottom.
   */
  scrollToBottom(ref: HTMLElement | null): void {
    if (!ref) return;
    setTimeout(() => {
      ref.scrollTop = ref.scrollHeight;
    }, 0);
  }
}
