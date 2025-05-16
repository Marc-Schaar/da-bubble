import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Firestore, onSnapshot, getDoc } from '@angular/fire/firestore';
import { FireServiceService } from '../services/firebase/fire-service.service';
import { UserService } from '../services/user/shared.service';
import { NavigationService } from '../services/navigation/navigation.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AddChannelComponent } from './add-channel/add-channel.component';
import { HeaderComponent } from '../header/header.component';
import { SearchResultComponent } from '../shared/search-result/search-result.component';
import { SearchService } from '../services/search/search.service';

@Component({
  selector: 'app-contactbar',
  standalone: true,
  imports: [CommonModule, HeaderComponent, MatIconModule, FormsModule, SearchResultComponent],
  templateUrl: './contactbar.component.html',
  styleUrl: './contactbar.component.scss',
})
export class ContactbarComponent implements OnInit {
  public userService = inject(UserService);
  private firestoreService = inject(FireServiceService);
  public router: Router = inject(Router);
  public navigationService: NavigationService = inject(NavigationService);
  private firestore = inject(Firestore);
  public searchService: SearchService = inject(SearchService);
  public channels: any = [];
  public allChannels: any = [];
  public users: any = [];
  public currentUser: any = [];
  public currentlist: any[] = [];
  public currentArray: any[] = [];
  isClicked = false;
  public currentReceiver: any;
  public userID: string | undefined = '';
  public currentChannel: string | null = null;
  public input: string = '';
  public currentLink: string = '';
  public addChannelWindow: boolean = false;
  public active: boolean = false;
  public message: boolean = false;

  /**
   * Constructor for SomeComponent. Initializes the component with the MatDialog service for dialog management.
   *
   * @param dialog - MatDialog service instance used to open and manage dialogs.
   */
  constructor(private dialog: MatDialog) {}

  /**
   * Initializes the component by loading users, channels, and setting the current user.
   */
  async ngOnInit() {
    if (!this.navigationService.isInitialize) {
      this.navigationService.initialize();
    }
    this.userService.dashboard = true;
    this.userService.login = false;
    await this.loadUsers();
    this.loadChannels();
    this.openDropdown();
    this.userID = this.userService.auth.currentUser?.uid;
    this.currentUser = this.userService.currentUser;
  }

  /**
   * Loads the list of users from the Firestore service.
   */
  private async loadUsers() {
    try {
      this.users = await this.firestoreService.getUsers();
    } catch (error) {}
  }

  /**
   * Loads the list of channels the current user is a member of.
   */
  private loadChannels() {
    let channelRef = this.firestoreService.getCollectionRef('channels');
    this.allChannels = [];
    if (channelRef) {
      onSnapshot(channelRef, (colSnap) => {
        this.allChannels = colSnap.docs.map((colSnap) => ({
          id: colSnap.id,
          ...colSnap.data(),
        }));
        this.channels = [];
        for (let i = 0; i < this.allChannels.length; i++) {
          const element = this.allChannels[i];
          if (this.userService.auth.currentUser?.isAnonymous && element.id === 'KqvcY68R1jP2UsQkv6Nz') {
            this.channels.push(element);
          } else {
            for (let y = 0; y < this.allChannels[i].member.length; y++) {
              const userId = this.allChannels[i].member[y].id;
              if (userId == this.userService.currentUser?.uid) {
                this.channels.push(element);
              }
            }
          }
        }
      });
    }
  }

  /**
   * Toggles the active state of the contact bar.
   */
  public toggleActive() {
    this.active = !this.active;
  }

  /**
   * Toggles the message state of the contact bar.
   */
  public toggleMessage() {
    this.message = !this.message;
  }

  /**
   * Checks if the message bar is open.
   * @returns True if the message bar is open.
   */
  public isOpen() {
    return this.message === true;
  }

  /**
   * Checks if the contact bar is active.
   * @returns True if the contact bar is active.
   */
  public isActive() {
    return this.active === true;
  }

  /**
   * Opens a specific window (direct message, channel, or new message) based on the provided type.
   * @param window - The window type to open ('direct', 'channel', or 'newMessage')
   * @param linkName - Optional link name for the window
   */
  public openWindow(window: 'direct' | 'channel' | 'newMessage', linkName?: string) {
    window === 'direct' ? this.navigationService.showDirect() : this.navigationService.showChannel();
    this.currentLink = linkName || '';
    this.navigationService.toggleThread('close');
  }

  /**
   * Opens the dropdown for a channel or user, based on the current navigation state.
   */
  private async openDropdown() {
    this.active = false;
    this.message = false;
    const isChannel = this.navigationService.channelType === 'channel';
    const collection = isChannel ? 'channels' : 'users';
    const docRef = this.firestoreService.getDocRef(collection, this.navigationService.reciverId);
    if (!docRef) return;
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;
    const data = docSnap.data();
    if (isChannel) {
      this.active = true;
      this.currentLink = data['name'];
    } else {
      this.message = true;
      this.currentLink = data['fullname'];
    }
  }

  /**
   * Opens the dialog to add a new channel.
   */
  public openAddChannel() {
    const dialogRef = this.dialog.open(AddChannelComponent, {
      width: '872px',
      maxWidth: '95vw',
      height: 'auto',
      position: { top: '50%', left: '50%' },
      panelClass: 'fullscreen',
      data: { channels: this.channels },
    });
  }
}
