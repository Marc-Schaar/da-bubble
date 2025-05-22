import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, where } from '@angular/fire/firestore';
import { UserService } from '../services/user/shared.service';
import { MessagesService } from '../services/messages/messages.service';
import { NavigationService } from '../services/navigation/navigation.service';
import { MatIconModule } from '@angular/material/icon';
import { TextareaTemplateComponent } from '../shared/textarea/textarea-template.component';
import { MessageTemplateComponent } from '../shared/message/message-template.component';
import { ChatHeaderComponent } from '../shared/chat-header/chat-header.component';
import { LinkifyPipe } from '../pipes/linkify.pipe';

@Component({
  selector: 'app-thread',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    TextareaTemplateComponent,
    MessageTemplateComponent,
    ChatHeaderComponent,
    LinkifyPipe,
  ],
  templateUrl: './chat-thread.component.html',
  styleUrls: ['./chat-thread.component.scss'],
})
export class ThreadComponent implements OnInit {
  @ViewChild('chat') chatContentRef!: ElementRef;
  private firestore: Firestore = inject(Firestore);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private messagesService: MessagesService = inject(MessagesService);
  public userService: UserService = inject(UserService);
  public navigationService: NavigationService = inject(NavigationService);
  public currentUser: any;
  public userId: string = '';
  public currentChannel: any;
  public currentChannelId: string = '';
  public parentMessageId: string = '';
  public inputEdit: string = '';
  public parentMessageData: any = null;
  public editingMessageId: number | null = null;
  public listOpen: boolean = false;
  public isEditing: boolean = false;
  public messages: any = [];
  public reactions: any = [];

  /**
   * A function that will unsubscribe from the Firestore snapshot listener for messages.
   *
   * @type {() => void}
   */
  unsubMessages!: () => void;

  /**
   * OnInit lifecycle hook to set up query params and fetch data when component is initialized.
   */
  async ngOnInit() {
    this.route.queryParams.subscribe(async (params) => {
      this.currentChannelId = params['reciverId'] || '';
      this.userId = params['currentUserId'] || '';
      this.parentMessageId = params['messageId'] || '';

      await this.getCurrentChannel();
      this.getThreadParentMessage();
      this.getMessages();
      this.currentUser = this.userService.currentUser;
    });
  }

  /**
   * Fetches the current channel information from Firestore.
   */
  private async getCurrentChannel() {
    if (this.currentChannelId) {
      let channelRef = doc(this.firestore, `channels/${this.currentChannelId}`);
      let channelRefDocSnap = await getDoc(channelRef);
      channelRefDocSnap.exists() ? (this.currentChannel = channelRefDocSnap.data()) : null;
    }
  }

  /**
   * Fetches the parent message details for the thread.
   */
  private async getThreadParentMessage() {
    if (this.parentMessageId) {
      let parentMessageDocRef = doc(this.firestore, `channels/${this.currentChannelId}/messages/${this.parentMessageId}`);
      let parentMessageDocSnap = await getDoc(parentMessageDocRef);

      if (parentMessageDocSnap.exists()) {
        let data = parentMessageDocSnap.data();
        this.setParentMessageData(data);
      }
    }
  }

  /**
   * Sets the parent message data.
   * @param data - The parent message data from Firestore.
   */
  private setParentMessageData(data: any) {
    let parentMessage = data;
    this.parentMessageData = {
      id: this.parentMessageId,
      ...parentMessage,
      time: new Date(data['timestamp'].toDate()).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  }

  /**
   * Retrieves the messages in the current thread.
   */
  private getMessages() {
    if (this.parentMessageId) {
      let threadRef = collection(this.firestore, `channels/${this.currentChannelId}/messages/${this.parentMessageId}/thread`);
      let threadQuery = query(threadRef, orderBy('timestamp', 'asc'));

      onSnapshot(threadQuery, (snapshot) => {
        this.messages = this.messagesService.processData(snapshot);
        this.userService.scrollToBottom(this.chatContentRef.nativeElement);
      });
    }
  }

  /**
   * Closes the current thread and redirects the user.
   */
  public closeThread() {
    if (!this.navigationService.isMobile) this.navigationService.toggleThread('close');
    this.userService.setUrl('channel', this.currentChannelId, this.userId);
  }

  /**
   * Handles click events on mention buttons within a message.
   * Determines whether a mention button was clicked and, if so,
   * extracts its symbol (@ or #) and the associated name,
   * then delegates to navigation logic.
   *
   * @param event - The MouseEvent triggered by the click.
   */
  onMentionClick(event: MouseEvent | TouchEvent) {
    const btn = (event.target as HTMLElement).closest('.tag-btn');
    if (!btn) return;

    const fullTag = btn.textContent?.trim();
    if (!fullTag) return;

    const symbol = fullTag.charAt(0);
    const name = fullTag.slice(1).trim();
    this.showProfileOrChannel(symbol, name);
  }

  /**
   * Routes the click on a mention based on its symbol.
   * If the symbol is '@', performs a user lookup;
   * if '#', performs a channel lookup.
   *
   * @param symbol - The mention symbol, either '@' or '#'.
   * @param name - The username or channel name to lookup.
   */
  async showProfileOrChannel(symbol: string, name: string) {
    switch (symbol) {
      case '@':
        await this.caseUser(name);
        break;

      case '#':
        await this.caseChannel(name);
        break;
    }
  }

  /**
   * Looks up a user in Firestore by their full name,
   * sets the navigation service’s receiver ID to the found user’s document ID,
   * and switches the UI to a direct chat view.
   *
   * @param name - The user’s full name to query.
   */
  async caseUser(name: string) {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('fullname', '==', name));
    const snapshot = await getDocs(q);
    const userDoc = snapshot.docs[0];
    this.navigationService.setUrl('direct', userDoc.id);
    this.navigationService.showDirect();
  }

  /**
   * Looks up a channel in Firestore by its name,
   * sets the navigation service’s receiver ID to the found channel’s document ID,
   * and switches the UI to the channel view.
   *
   * @param name - The channel’s name to query.
   */
  async caseChannel(name: string) {
    const channelsRef = collection(this.firestore, 'channels');
    const q = query(channelsRef, where('name', '==', name));
    const snapshot = await getDocs(q);
    const channelDoc = snapshot.docs[0];
    this.navigationService.setUrl('channel', channelDoc.id);
    this.navigationService.showChannel();
  }

  ngOnDestroy(): void {
    if (this.unsubMessages) {
      this.unsubMessages();
    }
  }
}
