import { Component, DestroyRef, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { ChatHeaderComponent } from '../chat-header/chat-header.component';
import { MessagesService } from '../../services/messages/messages.service';
import { UserService } from '../../../../shared/services/user/shared.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { LinkifyPipe } from '../../../../shared/pipes/linkify.pipe';
import { MessageTemplateComponent } from '../message/message-template.component';
import { AuthService } from '../../../app_auth/services/auth/auth.service';
import { TextareaTemplateComponent } from '../textarea/textarea-template.component';
import { ChannelService } from '../../../app_channel/services/channel/channel.service';
import { MentionService } from '../../../../shared/services/mention/mention.service';

@Component({
  selector: 'app-thread',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    ChatHeaderComponent,
    LinkifyPipe,
    TextareaTemplateComponent,
    MessageTemplateComponent,
  ],
  templateUrl: './chat-thread.component.html',
  styleUrls: ['./chat-thread.component.scss'],
})
export class ThreadComponent implements OnInit {
  @ViewChild('chat') chatContentRef!: ElementRef;
  private route: ActivatedRoute = inject(ActivatedRoute);
  public messagesService: MessagesService = inject(MessagesService);
  public userService: UserService = inject(UserService);
  public authService = inject(AuthService);
  public navigationService: NavigationService = inject(NavigationService);
  public channelService: ChannelService = inject(ChannelService);
  private mentionService: MentionService = inject(MentionService);
  private readonly destroyRef = inject(DestroyRef);
  public currentUser: any;
  public userId: string = '';
  public currentChannelId: string = '';
  public parentMessageId: string = '';
  public inputEdit: string = '';
  public parentMessageData: any = null;
  public editingMessageId: number | null = null;
  public listOpen: boolean = false;
  public isEditing: boolean = false;
  public reactions: any = [];

  /**
   * A function that will unsubscribe from the Firestore snapshot listener for messages.
   *
   * @type {() => void}
   */
  unsubMessages?: () => void;

  /**
   * OnInit lifecycle hook to set up query params and fetch data when component is initialized.
   */
  async ngOnInit() {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async (params) => {
      this.currentChannelId = params['reciverId'] || '';
      this.userId = params['currentUserId'] || '';
      this.parentMessageId = params['messageId'] || '';

      this.getThreadParentMessage();
      this.getMessages();
      this.currentUser = this.authService.currentUser();
    });
  }

  /**
   * Fetches the parent message details for the thread.
   */
  private async getThreadParentMessage() {
    if (this.parentMessageId) {
      const data = await this.messagesService.getParentMessage(this.currentChannelId, this.parentMessageId);
      if (data) this.setParentMessageData(data);
    } else {
      this.parentMessageData = null;
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
    this.unsubMessages?.();
    this.unsubMessages = undefined;

    if (this.parentMessageId) {
      this.unsubMessages = this.messagesService.subToThreadMessages(this.currentChannelId, this.parentMessageId);
    } else {
      this.messagesService.threadMessages.set([]);
    }
  }

  /**
   * Closes the current thread and redirects the user.
   */
  public closeThread() {
    this.navigationService.toggleThread('close');
  }

  /**
   * Delegates clicks inside the rendered message to the MentionService.
   */
  onMentionClick(event: MouseEvent | TouchEvent) {
    this.mentionService.handleMentionClick(event);
  }

  ngOnDestroy(): void {
    if (this.unsubMessages) {
      this.unsubMessages();
    }
    this.messagesService.threadMessages.set([]);
  }
}
