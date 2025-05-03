import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../shared.service';
import { FireServiceService } from '../fire-service.service';
import { Firestore, collection, doc, getDoc, onSnapshot, orderBy, query } from '@angular/fire/firestore';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Message } from '../models/message/message';
import { MessagesService } from '../service/messages/messages.service';
import { NavigationService } from '../service/navigation/navigation.service';
import { TextareaTemplateComponent } from '../shared/textarea/textarea-template.component';
import { MessageTemplateComponent } from '../shared/message/message-template.component';

@Component({
  selector: 'app-thread',
  imports: [CommonModule, FormsModule, MatIconModule, RouterLink, TextareaTemplateComponent, MessageTemplateComponent],
  templateUrl: './thread.component.html',
  styleUrls: ['./thread.component.scss'],
})
export class ThreadComponent implements OnInit {
  firestore: Firestore = inject(Firestore);
  userService: UserService = inject(UserService);
  fireService: FireServiceService = inject(FireServiceService);
  route: ActivatedRoute = inject(ActivatedRoute);
  router: Router = inject(Router);
  messagesService: MessagesService = inject(MessagesService);
  navigationService: NavigationService = inject(NavigationService);

  currentUser: any;

  userId: string = '';
  currentChannel: any;
  currentChannelId: string = '';
  parentMessageId: string = '';
  inputEdit: string = '';
  parentMessageData: any = null;
  editingMessageId: number | null = null;

  listOpen: boolean = false;
  isEditing: boolean = false;

  messages: any = [];
  reactions: any = [];

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
  async getCurrentChannel() {
    if (this.currentChannelId) {
      let channelRef = doc(this.firestore, `channels/${this.currentChannelId}`);
      let channelRefDocSnap = await getDoc(channelRef);
      channelRefDocSnap.exists() ? (this.currentChannel = channelRefDocSnap.data()) : null;
    }
  }

  /**
   * Fetches the parent message details for the thread.
   */
  async getThreadParentMessage() {
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
  setParentMessageData(data: any) {
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
  getMessages() {
    if (this.parentMessageId) {
      let threadRef = collection(this.firestore, `channels/${this.currentChannelId}/messages/${this.parentMessageId}/thread`);
      let threadQuery = query(threadRef, orderBy('timestamp', 'asc'));

      onSnapshot(threadQuery, (snapshot) => {
        this.messages = this.messagesService.processData(snapshot);
      });
    }
  }

  /**
   * Closes the current thread and redirects the user.
   */
  closeThread() {
    if (this.navigationService.isMobile) {
      this.router.navigate(['/channel'], {
        queryParams: { channelType: 'channel', id: this.currentChannelId, currentUserId: this.userId },
      });
    }
    this.userService.toggleThread('close');
  }

  ngOnDestroy(): void {
    if (this.unsubMessages) {
      this.unsubMessages();
    }
  }
}
