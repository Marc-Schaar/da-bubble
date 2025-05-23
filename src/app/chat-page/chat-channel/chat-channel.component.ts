import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Firestore, onSnapshot, query, orderBy, collection, doc } from '@angular/fire/firestore';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { DividerTemplateComponent } from '../../shared/divider/divider-template.component';
import { TextareaTemplateComponent } from '../../shared/textarea/textarea-template.component';
import { MessageTemplateComponent } from '../../shared/message/message-template.component';
import { ChatHeaderComponent } from '../../shared/chat-header/chat-header.component';
import { FireServiceService } from '../../services/firebase/fire-service.service';
import { UserService } from '../../services/user/shared.service';
import { NavigationService } from '../../services/navigation/navigation.service';
import { MessagesService } from '../../services/messages/messages.service';
import { User } from '../../models/user/user';
import { ChannelEditComponent } from '../../dialogs/channel-edit/channel-edit.component';
import { AddMemberComponent } from '../../dialogs/add-member/add-member.component';

@Component({
  selector: 'app-chat-content',
  imports: [
    MatIconModule,
    MatButtonModule,
    CommonModule,
    FormsModule,
    MatSidenavModule,
    MatMenuModule,
    MatDialogModule,
    DividerTemplateComponent,
    TextareaTemplateComponent,
    MessageTemplateComponent,
    ChatHeaderComponent,
  ],
  templateUrl: './chat-channel.component.html',
  styleUrl: './chat-channel.component.scss',
})
export class ChatContentComponent implements OnInit, OnDestroy {
  @ViewChild('chatContent') chatContentRef!: ElementRef;
  private subscriptions = new Subscription();
  fireService: FireServiceService = inject(FireServiceService);
  userService: UserService = inject(UserService);
  firestore: Firestore = inject(Firestore);
  dialog = inject(MatDialog);
  navigationService: NavigationService = inject(NavigationService);
  messagesService: MessagesService = inject(MessagesService);
  route: ActivatedRoute = inject(ActivatedRoute);

  isMobile: boolean = false;
  showBackground: boolean = false;
  channels: any = [];
  messages: any;
  currentChannel: any = {};
  channelInfo: boolean = false;
  addMemberInfoWindow: boolean = false;
  addMemberWindow: boolean = false;
  unsubMessages!: () => void;
  currentUser: User = new User(null);
  public userId: string = '';
  public currentChannelId: string = '';

  /**
  /**
   * Initializes the component, loads messages and channel data from URL parameters.
   */
  async ngOnInit() {
    if (!this.navigationService.isInitialize) {
      this.navigationService.initialize();
    }
    this.route.queryParamMap.subscribe((params) => {
      this.currentChannelId = params.get('reciverId') || '';
      this.userId = params.get('currentUserId') || '';
      this.getMessages();
      this.getChannelFromUrl();
      this.currentUser = this.userService.currentUser;
    });
  }

  /**
   * Cleans up subscriptions and listeners when the component is destroyed.
   */
  ngOnDestroy() {
    if (this.unsubMessages) this.unsubMessages();
    this.subscriptions.unsubscribe();
  }

  /**
   * Loads the current channel from Firestore based on the channel ID.
   */
  getChannelFromUrl() {
    if (this.currentChannelId) {
      const docRef = doc(this.firestore, 'channels', this.currentChannelId);
      onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          this.currentChannel = { id: docSnap.id, ...docSnap.data() };
        } else {
          this.currentChannel = null;
        }
      });
    }
  }

  /**
   * Retrieves messages for the current channel and loads their threads.
   */
  getMessages() {
    this.unsubMessages = this.messagesService.getChannelMessages(this.currentChannelId, (messages) => {
      this.messages = messages;
      this.messages.forEach((message: any) => {
        this.getThread(message.id);
        this.userService.scrollToBottom(this.chatContentRef?.nativeElement);
      });
    });
  }

  /**
   * Loads the thread (replies) for a specific message.
   * @param messageId - ID of the message to load the thread for
   */
  getThread(messageId: string) {
    if (messageId) {
      let threadRef = collection(this.firestore, `channels/${this.currentChannelId}/messages/${messageId}/thread`);
      let threadQuery = query(threadRef, orderBy('timestamp', 'asc'));

      onSnapshot(threadQuery, (snapshot) => {
        const updatedThreads = this.messagesService.processData(snapshot);
        const msgIndex = this.messages.findIndex((m: any) => m.id === messageId);
        if (msgIndex >= 0) this.messages[msgIndex].thread = updatedThreads;
      });
    }
  }

  /**
   * Opens the dialog to view or edit channel information.
   */
  openChannelInfo() {
    const dialogData = {
      currentChannel: this.currentChannel,
      currentChannelId: this.currentChannelId,
      currentUser: this.currentUser,
    };
    this.dialog.open(ChannelEditComponent, {
      data: dialogData,
      position: { top: '200px' },
      width: '872px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: ['fullscreen'],
    });
  }

  /**
   * Opens or closes the dialog to add members to the channel.
   * @param toggle - Whether to show or hide the dialog
   */
  openMemberWindow(toggle: boolean) {
    this.addMemberWindow = toggle;
    const dialogData = {
      currentChannel: this.currentChannel,
      currentChannelId: this.currentChannelId,
      currentUser: this.currentUser,
      addMemberWindow: toggle,
    };
    this.dialog.open(AddMemberComponent, {
      data: dialogData,
      width: 'auto',
      maxWidth: '95vw',
      maxHeight: '90vh',
      height: '413px',
      panelClass: ['add-member-dialog', 'transparent-dialog-bg'],
      position: { top: '200px', right: '150px' },
    });
  }
}
