import { Component, inject, Injectable, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { UserService } from '../shared.service';
import { getDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FireServiceService } from '../fire-service.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NavigationService } from '../service/navigation/navigation.service';
import { MessagesService } from '../service/messages/messages.service';
import { DividerTemplateComponent } from '../shared/divider/divider-template.component';
import { Subscription } from 'rxjs';
import { TextareaTemplateComponent } from '../shared/textarea/textarea-template.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserProfileComponent } from '../header/user-profile/user-profile.component';

@Injectable({
  providedIn: 'root',
})
@Component({
  selector: 'app-direct-messages',
  imports: [FormsModule, CommonModule, RouterLink, MatIconModule, DividerTemplateComponent, TextareaTemplateComponent, MatDialogModule],
  templateUrl: './direct-messages.component.html',
  styleUrl: './direct-messages.component.scss',
})
export class DirectmessagesComponent implements OnInit, OnDestroy {
  @ViewChild('chat') chatContentRef!: ElementRef;
  channels: any[] = [];
  users: any[] = [];
  currentReciever: any = null;
  currentUser: any = null;
  currentMessages: any[] = [];
  isClicked: boolean = false;
  listKey: string = '';
  isProfileCard: boolean = false;
  //Cleancode Update
  public userService = inject(UserService);
  public navigationService = inject(NavigationService);
  private firestoreService = inject(FireServiceService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private messagesService = inject(MessagesService);
  readonly dialog = inject(MatDialog);
  private subscriptions = new Subscription();
  private unsubMessages!: () => void;
  public currentRecieverId: string = '';
  public currentUserId: string = '';

  /**
   * Initializes the component and loads the necessary data such as receiver information, messages, users, and channels.
   */
  ngOnInit() {
    this.navigationService.initialize();
    this.route.queryParamMap.subscribe((params) => {
      this.currentRecieverId = params.get('reciverId') || '';
      this.currentUserId = params.get('currentUserId') || '';

      this.currentUser = this.userService.currentUser;
      this.getRecieverFromUrl();
      this.loadMessages();
      this.loadUsers();
      this.loadChannels();
    });
  }

  /**
   * Retrieves the receiver's data from Firestore using the receiver ID.
   */
  async getRecieverFromUrl() {
    if (this.currentRecieverId) {
      const docRef = this.firestoreService.getDocRef('users', this.currentRecieverId);
      if (docRef) {
        const docSnap = await getDoc(docRef);
        docSnap.exists() ? (this.currentReciever = docSnap.data()) : null;
      }
    }
  }

  /**
   * Loads the conversation messages between the current user and receiver.
   */
  private loadMessages() {
    this.unsubMessages = this.messagesService.getConversationMessages(this.currentUserId, this.currentRecieverId, (messages) => {
      this.currentMessages = messages;
      this.isMessagesEmpty();
    });
  }

  /**
   * Loads the list of users from Firestore.
   */
  private async loadUsers() {
    try {
      this.users = await this.firestoreService.getUsers();
    } catch (error) {
      console.error('Error loading users in component:', error);
    }
  }

  /**
   * Loads the list of channels from Firestore.
   */
  private async loadChannels() {
    try {
      this.channels = await this.firestoreService.getChannels();
    } catch (error) {
      console.error('Error loading channels in component:', error);
    }
  }

  /**
   * Hides the list of users or channels.
   */
  public hideList() {
    this.isClicked = false;
  }

  /**
   * Checks if the current message list is empty.
   * @returns True if the current messages array is empty.
   */
  public isMessagesEmpty(): boolean {
    return this.currentMessages.length === 0;
  }

  /**
   * Checks if the given message is sent by the current user.
   * @param message The message to check.
   * @returns True if the message is from the current user.
   */
  public isUser(message: any): boolean {
    return message.from === this.currentUserId;
  }

  /**
   * Checks if the current user is the receiver.
   * @returns True if the current user is the receiver.
   */
  public isYou(): boolean {
    return this.currentRecieverId === this.currentUserId;
  }

  /**
   * Cleans up any subscriptions and unsubscriptions when the component is destroyed.
   */
  public ngOnDestroy() {
    if (this.unsubMessages) this.unsubMessages();
    this.subscriptions.unsubscribe();
  }

  /*
    toggleProfile() {
      this.isProfileCard = !this.isProfileCard
    }
  
    closeProfile() {
      this.isProfileCard = false;
    }
  */

  /**
   * Displays the receiver's profile.
   */
  public showProfile() {
    this.dialog.open(UserProfileComponent, { width: '550px' });
    // this.userService.showRecieverProfile();
  }
}
