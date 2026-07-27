import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild, OnDestroy, untracked, effect, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ChannelService } from '../../../channel/services/channel/channel.service';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ActivatedRoute } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AddMemberComponent } from '../../../channel/components/add-member/add-member.component';
import { DividerTemplateComponent } from '../divider/divider-template.component';
import { MessageTemplateComponent } from '../message/message-template.component';
import { UserService } from '../../../../shared/services/user/shared.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { MessagesService } from '../../services/messages/messages.service';
import { EditChannelComponent } from '../../../channel/components/edit-channel/edit-channel.component';
import { ChatHeaderComponent } from '../chat-header/chat-header.component';
import { TextareaTemplateComponent } from '../textarea/textarea-template.component';
import { ChatService } from '../../services/chat/chat.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
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
    ButtonComponent,
  ],
  templateUrl: './chat-channel.component.html',
  styleUrl: './chat-channel.component.scss',
})
export class ChatContentComponent implements OnInit, OnDestroy {
  @ViewChild('chatContent') chatContentRef!: ElementRef;
  private readonly userService: UserService = inject(UserService);
  public readonly channelService: ChannelService = inject(ChannelService);
  private readonly dialog = inject(MatDialog);
  public readonly navigationService: NavigationService = inject(NavigationService);
  public readonly messagesService: MessagesService = inject(MessagesService);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  public readonly chatService: ChatService = inject(ChatService);
  private readonly destroyRef = inject(DestroyRef);

  public readonly currentChannelId = signal<string | null>(null);

  private unsubMessages?: () => void;

  constructor() {
    effect(() => {
      const channelId = this.currentChannelId();
      untracked(() => {
        this.unsubMessages?.();
        this.unsubMessages = undefined;
        if (channelId) {
          this.unsubMessages = this.messagesService.subToMessages(channelId);
        }
        this.channelService.setActiveChannel(channelId);
      });
    });

    effect(() => {
      const messages = this.messagesService.messages();
      untracked(() => {
        if (this.messagesService.messages().length > 0) {
          this.handleScroll();
        }
      });
    });
  }

  /**
  /**
   * Initializes the component, loads messages and channel data from URL parameters.
   */
  async ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.currentChannelId.set(params.get('id'));
    });
  }

  private handleScroll() {
    this.userService.scrollToBottomIfNear(this.chatContentRef?.nativeElement ?? null);
  }

  /**
   * Sends a new message to the currently open channel.
   */
  onSend(text: string) {
    this.messagesService.sendChannelMessage(text, this.currentChannelId() || '');
  }

  /**
   * Opens the dialog to view or edit channel information.
   */
  openChannelInfo() {
    this.dialog.open(EditChannelComponent, {
      position: { top: '200px' },
      width: '872px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: ['fullscreen'],
    });
  }

  /**
   * Opens the dialog to add members to the channel.
   */
  openMemberWindow() {
    this.dialog.open(AddMemberComponent, {
      width: 'auto',
      maxWidth: '95vw',
      maxHeight: '90vh',
      height: '413px',
      panelClass: ['add-member-dialog', 'transparent-dialog-bg'],
      position: { top: '200px', right: '150px' },
    });
  }

  /**
   * Cleans up subscriptions and listeners when the component is destroyed.
   */
  ngOnDestroy() {
    if (this.unsubMessages) this.unsubMessages();
    this.messagesService.messages.set([]);
    this.channelService.setActiveChannel(null);
  }
}
