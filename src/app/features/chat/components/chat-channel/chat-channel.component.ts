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
import { User } from '../../../auth/models/user/user';
import { AddMemberComponent } from '../../../channel/components/add-member/add-member.component';
import { DividerTemplateComponent } from '../divider/divider-template.component';
import { MessageTemplateComponent } from '../message/message-template.component';
import { UserService } from '../../../../shared/services/user/shared.service';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { MessagesService } from '../../services/messages/messages.service';
import { EditChannelComponent } from '../../../channel/components/edit-channel/edit-channel.component';
import { ChatHeaderComponent } from '../chat-header/chat-header.component';
import { TextareaTemplateComponent } from '../textarea/textarea-template.component';
import { ChatService } from '../../services/chat/chat.service';
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
  fireService: FireServiceService = inject(FireServiceService);
  userService: UserService = inject(UserService);
  channelService: ChannelService = inject(ChannelService);
  dialog = inject(MatDialog);
  navigationService: NavigationService = inject(NavigationService);
  messagesService: MessagesService = inject(MessagesService);
  route: ActivatedRoute = inject(ActivatedRoute);
  public chatService: ChatService = inject(ChatService);
  private readonly destroyRef = inject(DestroyRef);

  isMobile: boolean = false;
  showBackground: boolean = false;
  channels: any = [];

  channelInfo: boolean = false;
  addMemberInfoWindow: boolean = false;
  addMemberWindow: boolean = false;

  currentUser: User | null = null;
  public userId: string = '';

  public currentChannelId = signal<string | null>(null);

  unsubMessages?: () => void;

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
    const element = this.chatContentRef?.nativeElement;
    if (!element) return;

    const threshold = 100;
    const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < threshold;

    if (isNearBottom) {
      this.userService.scrollToBottom(element);
    }
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
   * Opens or closes the dialog to add members to the channel.
   * @param toggle - Whether to show or hide the dialog
   */
  openMemberWindow(toggle: boolean) {
    this.addMemberWindow = toggle;

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
