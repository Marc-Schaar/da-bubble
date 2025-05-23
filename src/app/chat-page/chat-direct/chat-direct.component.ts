import { Component, inject, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { getDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { UserService } from '../../services/user/shared.service';
import { FireServiceService } from '../../services/firebase/fire-service.service';
import { NavigationService } from '../../services/navigation/navigation.service';
import { MessagesService } from '../../services/messages/messages.service';

import { DividerTemplateComponent } from '../../shared/divider/divider-template.component';
import { MessageTemplateComponent } from '../../shared/message/message-template.component';
import { TextareaTemplateComponent } from '../../shared/textarea/textarea-template.component';
import { DialogReciverComponent } from '../../dialogs/dialog-reciver/dialog-reciver.component';
import { Subscription } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ChatHeaderComponent } from '../../shared/chat-header/chat-header.component';

@Component({
  selector: 'app-direct-messages',
  imports: [
    FormsModule,
    CommonModule,

    MatIconModule,
    DividerTemplateComponent,
    TextareaTemplateComponent,
    MatDialogModule,
    MessageTemplateComponent,
    ChatHeaderComponent,
  ],
  templateUrl: './chat-direct.component.html',
  styleUrl: './chat-direct.component.scss',
})
export class DirectmessagesComponent implements OnInit, OnDestroy {
  @ViewChild('chat') chatContentRef!: ElementRef;
  public readonly userService = inject(UserService);
  public readonly navigationService = inject(NavigationService);
  private readonly firestoreService = inject(FireServiceService);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private messagesService = inject(MessagesService);
  public currentReciever: any = null;
  private currentUser: any;
  public currentRecieverId: string = '';
  public currentUserId: string = '';
  public currentMessages: any[] = [];
  private isClicked: boolean = false;
  private subscriptions = new Subscription();
  private unsubMessages!: () => void;

  /**
   * Initializes the component and loads the necessary data such as receiver information, messages, users, and channels.
   */
  ngOnInit() {
    if (!this.navigationService.isInitialize) {
      this.navigationService.initialize();
    }
    this.route.queryParamMap.subscribe((params) => {
      this.currentRecieverId = params.get('reciverId') || '';
      this.currentUserId = params.get('currentUserId') || '';

      this.currentUser = this.userService.currentUser;
      this.getRecieverFromUrl();
      this.loadMessages();
    });
  }

  /**
   * Retrieves the receiver's data from Firestore using the receiver ID.
   */
  private async getRecieverFromUrl() {
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
      this.userService.scrollToBottom(this.chatContentRef.nativeElement);
    });
  }

  /**
   * Hides the list of users or channels.
   */
  public hideList() {
    this.isClicked = false;
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
   * Displays the receiver's profile.
   */
  public showProfile() {
    this.dialog.open(DialogReciverComponent, {
      data: {
        reciever: this.currentReciever,
        recieverId: this.currentRecieverId,
      },
      width: '400px',
      panelClass: ['center-dialog'],
    });
  }

  /**
   * Cleans up any subscriptions and unsubscriptions when the component is destroyed.
   */
  public ngOnDestroy() {
    if (this.unsubMessages) this.unsubMessages();
    this.subscriptions.unsubscribe();
  }
}
