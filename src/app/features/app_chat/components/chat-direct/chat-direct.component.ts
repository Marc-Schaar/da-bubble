import { Component, inject, OnInit, ElementRef, ViewChild, OnDestroy, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DialogReceiverComponent } from '../../../../shared/components/dialog-receiver/dialog-receiver.component';

import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DividerTemplateComponent } from '../divider/divider-template.component';
import { MessageTemplateComponent } from '../message/message-template.component';
import { UserService } from '../../../../shared/services/user/shared.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { UserStore } from '../../../../shared/services/user/user-store';
import { MessagesService } from '../../services/messages/messages.service';
import { ChatHeaderComponent } from '../chat-header/chat-header.component';
import { User } from '../../../app_auth/models/user/user';
import { AuthService } from '../../../app_auth/services/auth/auth.service';
import { TextareaTemplateComponent } from '../textarea/textarea-template.component';
import { ChatService } from '../../services/chat/chat.service';
import { ProfileStatusComponent } from '../../../../shared/components/profile-status/profile-status.component';

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
  private readonly dialog = inject(MatDialog);
  public messagesService = inject(MessagesService);
  public chatService: ChatService = inject(ChatService);
  private readonly destroyRef = inject(DestroyRef);

  public currentReceiverId = signal<string | null>(null);
  public currentReceiver = signal<User | null>(null);
  public readonly currentUserId = computed(() => this.authService.currentUser()?.id || '');

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
    this.dialog.open(DialogReceiverComponent, {
      data: this.currentReceiver(),
      width: '400px',
      panelClass: ['center-dialog'],
    });
  }

  public hideList() {}

  ngOnDestroy(): void {
    if (this.unsubDirectMessages) this.unsubDirectMessages();
    this.messagesService.messages.set([]);
  }
}
