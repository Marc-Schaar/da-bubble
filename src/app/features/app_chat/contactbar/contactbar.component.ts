import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { getDoc } from '@angular/fire/firestore';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { HeaderComponent } from '../../../shared/components/header/header.component';
import { UserService } from '../../../shared/services/user/shared.service';
import { FireServiceService } from '../../../shared/services/firebase/fire-service.service';
import { SearchResultComponent } from '../../../shared/components/search-result/search-result.component';
import { NavigationService } from '../../../shared/services/navigation/navigation.service';
import { SearchService } from '../../../shared/services/search/search.service';
import { AddChannelComponent } from '../../app_channel/components/add-channel/add-channel.component';

@Component({
  selector: 'app-contactbar',
  standalone: true,
  imports: [CommonModule, HeaderComponent, MatIconModule, FormsModule, SearchResultComponent],
  templateUrl: './contactbar.component.html',
  styleUrl: './contactbar.component.scss',
})
export class ContactbarComponent implements OnInit, OnDestroy {
  public userService = inject(UserService);
  public firestoreService = inject(FireServiceService);
  public router: Router = inject(Router);
  public navigationService: NavigationService = inject(NavigationService);
  public searchService: SearchService = inject(SearchService);

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

  private unsubUsers?: any;
  private unsubChannels?: any;

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
    this.unsubUsers = this.firestoreService.subAllUsers();
    this.unsubChannels = this.firestoreService.subChannels();

    this.openDropdown();
    this.userID = this.userService.auth.currentUser?.uid;
    this.currentUser = this.userService.currentUser;
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
    // this.active = false;
    // this.message = false;
    // const isChannel = this.navigationService.channelType === 'channel';
    // const collection = isChannel ? 'channels' : 'users';
    // const docRef = this.firestoreService.getDocRef(collection, this.navigationService.reciverId);
    // if (!docRef) return;
    // const docSnap = await getDoc(docRef);
    // if (!docSnap.exists()) return;
    // const data = docSnap.data();
    // if (isChannel) {
    //   this.active = true;
    //   this.currentLink = data['name'];
    // } else {
    //   this.message = true;
    //   this.currentLink = data['fullname'];
    // }
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
      data: {},
    });
  }

  ngOnDestroy() {
    if (this.unsubUsers) this.unsubUsers();
    if (this.unsubChannels) this.unsubChannels();
  }
}
