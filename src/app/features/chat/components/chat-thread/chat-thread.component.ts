import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, effect, inject, OnInit, signal, untracked, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { ChatHeaderComponent } from '../chat-header/chat-header.component';
import { MessagesService } from '../../services/messages/messages.service';
import { scrollToBottomIfNear } from '../../../../shared/utils/scroll.util';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { MessageTemplateComponent } from '../message/message-template.component';
import { DividerTemplateComponent } from '../divider/divider-template.component';
import { TextareaTemplateComponent } from '../textarea/textarea-template.component';
import { ChannelService } from '../../../channel/services/channel/channel.service';
import { isNewDay } from '../../../../shared/utils/chat.util';
import { ChannelMessage } from '../../models/channel-message/channel-message';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { CardHeaderComponent } from '../../../../shared/components/card-header/card-header.component';

@Component({
  selector: 'app-thread',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    ChatHeaderComponent,
    TextareaTemplateComponent,
    MessageTemplateComponent,
    DividerTemplateComponent,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
  ],
  templateUrl: './chat-thread.component.html',
  styleUrls: ['./chat-thread.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThreadComponent implements OnInit {
  @ViewChild('chat') chatContentRef!: ElementRef;
  private route: ActivatedRoute = inject(ActivatedRoute);
  public messagesService: MessagesService = inject(MessagesService);
  public navigationService: NavigationService = inject(NavigationService);
  public channelService: ChannelService = inject(ChannelService);
  public readonly isNewDay = isNewDay;
  private readonly destroyRef = inject(DestroyRef);
  public currentChannelId = signal('');
  public parentMessageId = signal('');
  public parentMessageData = signal<ChannelMessage | null>(null);
  public listOpen: boolean = false;

  constructor() {
    effect(() => {
      const messages = this.messagesService.threadMessages();
      untracked(() => {
        if (messages.length > 0) {
          scrollToBottomIfNear(this.chatContentRef?.nativeElement ?? null);
        }
      });
    });
  }

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
      this.currentChannelId.set(params['receiverId'] || '');
      this.parentMessageId.set(params['messageId'] || '');

      this.getThreadParentMessage();
      this.getMessages();
    });
  }

  /**
   * Fetches the parent message details for the thread via MessagesService.
   */
  private async getThreadParentMessage() {
    this.parentMessageData.set(
      this.parentMessageId() ? await this.messagesService.getParentMessage(this.currentChannelId(), this.parentMessageId()) : null,
    );
  }

  /**
   * Retrieves the messages in the current thread.
   */
  private getMessages() {
    this.unsubMessages?.();
    this.unsubMessages = undefined;

    if (this.parentMessageId()) {
      this.unsubMessages = this.messagesService.subToThreadMessages(this.currentChannelId(), this.parentMessageId());
    } else {
      this.messagesService.threadMessages.set([]);
    }
  }

  /**
   * Sends a new reply to the current thread.
   */
  onSend(text: string) {
    this.messagesService.sendThreadMessage(text, this.currentChannelId(), this.parentMessageId());
  }

  /**
   * Closes the current thread and redirects the user.
   */
  public closeThread() {
    this.navigationService.toggleThread('close');
  }

  ngOnDestroy(): void {
    if (this.unsubMessages) {
      this.unsubMessages();
    }
    this.messagesService.threadMessages.set([]);
  }
}
