import { Component, inject, OnInit, ElementRef, ViewChild, OnDestroy, signal, computed, effect, untracked, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { DividerTemplateComponent } from '../divider/divider-template.component';
import { MessageTemplateComponent } from '../message/message-template.component';
import { UserService } from '../../../../shared/services/user/shared.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { UserStore } from '../../../../shared/services/user/user-store';
import { MessagesService } from '../../services/messages/messages.service';
import { ChatHeaderComponent } from '../chat-header/chat-header.component';
import { User } from '../../../auth/models/user/user';
import { AuthService } from '../../../auth/services/auth/auth.service';
import { TextareaTemplateComponent } from '../textarea/textarea-template.component';
import { ChatService } from '../../services/chat/chat.service';
import { ProfileStatusComponent } from '../../../../shared/components/profile-status/profile-status.component';
import { ProfileDialogService } from '../../../../shared/services/profile-dialog/profile-dialog.service';
import { SearchService } from '../../../../shared/services/search/search.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { CardHeaderComponent } from '../../../../shared/components/card-header/card-header.component';

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
    ProfileStatusComponent,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
  ],
  templateUrl: './chat-direct.component.html',
  styleUrl: './chat-direct.component.scss',
})
export class DirectmessagesComponent implements OnInit, OnDestroy {
  @ViewChild('chat') chatContentRef!: ElementRef;
  public readonly userService = inject(UserService);
  public readonly navigationService = inject(NavigationService);
  private readonly userStore = inject(UserStore);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  public readonly authService = inject(AuthService);
  private readonly profileDialogService = inject(ProfileDialogService);
  private readonly searchService = inject(SearchService);
  public messagesService = inject(MessagesService);
  public chatService: ChatService = inject(ChatService);
  private readonly destroyRef = inject(DestroyRef);

  public currentReceiverId = signal<string | null>(null);
  public currentReceiver = signal<User | null>(null);
  public readonly currentUserId = computed(() => this.authService.currentUser()?.id || '');

  constructor() {
    effect(() => {
      const messages = this.messagesService.messages();
      untracked(() => {
        if (messages.length > 0) {
          this.userService.scrollToBottomIfNear(this.chatContentRef?.nativeElement ?? null);
        }
      });
    });
  }

  /**
   * Initializes the component and loads the necessary data such as receiver information, messages, users, and channels.
   */
  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.currentReceiverId.set(params.get('id'));
      this.getReceiverFromUrl();
      this.loadDirectChat(this.currentReceiverId() || '');
    });
  }

  unsubDirectMessages?: () => void;

  loadDirectChat(otherUserId: string) {
    if (this.unsubDirectMessages) this.unsubDirectMessages();

    this.unsubDirectMessages = this.messagesService.subToConversationMessages(this.currentUserId(), otherUserId);
  }

  /**
   * Sends a new direct message to the current receiver.
   */
  onSend(text: string) {
    this.messagesService.sendDirectMessage(text, this.currentReceiverId() || '');
  }

  /**
   * Retrieves the receiver's data using the receiver ID from the route.
   */
  private async getReceiverFromUrl() {
    const user = await this.userStore.getUserById(this.currentReceiverId() || '');
    if (user) this.currentReceiver.set(user);
  }

  /**
   * Checks if the given message is sent by the current user.
   * @param message The message to check.
   * @returns True if the message is from the current user.
   */
  public isUser(message: any): boolean {
    return message.from === this.currentUserId();
  }

  /**
   * Checks if the current user is the receiver.
   * @returns True if the current user is the receiver.
   */
  public isYou(): boolean {
    return this.currentReceiverId() === this.currentUserId();
  }

  /**
   * Displays the receiver's profile.
   */
  public showProfile() {
    this.profileDialogService.open(this.currentReceiver());
  }

  /**
   * Closes an open mention/search suggestion dropdown when clicking
   * elsewhere in the chat (mirrors MainChatComponent.closeAll()).
   */
  public hideList() {
    this.searchService.resetList();
  }

  ngOnDestroy(): void {
    if (this.unsubDirectMessages) this.unsubDirectMessages();
    this.messagesService.messages.set([]);
  }
}
