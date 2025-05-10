import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, doc, getDoc, onSnapshot, orderBy, query } from '@angular/fire/firestore';
import { UserService } from '../shared.service';
import { MessagesService } from '../service/messages/messages.service';
import { NavigationService } from '../service/navigation/navigation.service';
import { MatIconModule } from '@angular/material/icon';
import { TextareaTemplateComponent } from '../shared/textarea/textarea-template.component';
import { MessageTemplateComponent } from '../shared/message/message-template.component';

@Component({
  selector: 'app-thread',
  imports: [CommonModule, FormsModule, MatIconModule, RouterLink, TextareaTemplateComponent, MessageTemplateComponent],
  templateUrl: './thread.component.html',
  styleUrls: ['./thread.component.scss'],
})
export class ThreadComponent implements OnInit {
  @ViewChild('chat') chatContentRef!: ElementRef;

  private firestore: Firestore = inject(Firestore);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
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
        console.log('scrollen');
      });
    }
  }

  /**
   * Closes the current thread and redirects the user.
   */
  public closeThread() {
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
