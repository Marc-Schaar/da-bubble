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
import { LinkifyPipe } from '../../../pipes/linkify.pipe';
import { MessageTemplateComponent } from '../message/message-template.component';
import { AuthService } from '../../../app_auth/services/auth/auth.service';
import { TextareaTemplateComponent } from '../textarea/textarea-template.component';
import { UserStore } from '../../../../shared/services/user/user-store';
import { ChannelService } from '../../../app_channel/services/channel/channel.service';

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
  private userStore: UserStore = inject(UserStore);
  public channelService: ChannelService = inject(ChannelService);
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
    const user = await this.userStore.findUserByDisplayName(name);
    if (user) this.navigationService.selectDirectMessageRecipient(user.id);
  }

  /**
   * Looks up a channel in Firestore by its name,
   * sets the navigation service’s receiver ID to the found channel’s document ID,
   * and switches the UI to the channel view.
   *
   * @param name - The channel’s name to query.
   */
  async caseChannel(name: string) {
    const channel = await this.channelService.findChannelByName(name);
    if (channel?.id) this.navigationService.selectChannel(channel.id);
  }

  ngOnDestroy(): void {
    if (this.unsubMessages) {
      this.unsubMessages();
    }
    this.messagesService.threadMessages.set([]);
  }
}
