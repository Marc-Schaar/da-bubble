import { Component, inject, OnInit, ElementRef, ViewChild, OnDestroy, signal, computed } from '@angular/core';
import { getDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DialogReciverComponent } from '../../../dialogs/dialog-reciver/dialog-reciver.component';

import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DividerTemplateComponent } from '../divider/divider-template.component';
import { MessageTemplateComponent } from '../message/message-template.component';
import { UserService } from '../../../../shared/services/user/shared.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
import { MessagesService } from '../../services/messages/messages.service';
import { ChatHeaderComponent } from '../chat-header/chat-header.component';
import { User } from '../../../app_auth/models/user/user';
import { AuthService } from '../../../app_auth/services/auth/auth.service';
import { TextareaTemplateComponent } from '../textarea/textarea-template.component';
import { ChatService } from '../../services/chat/chat.service';

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
  ],
  templateUrl: './chat-direct.component.html',
  styleUrl: './chat-direct.component.scss',
})
export class DirectmessagesComponent implements OnInit, OnDestroy {
  @ViewChild('chat') chatContentRef!: ElementRef;
  public readonly userService = inject(UserService);
  public readonly navigationService = inject(NavigationService);
  private readonly firestoreService = inject(FireServiceService);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  public readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  public messagesService = inject(MessagesService);
  public chatService: ChatService = inject(ChatService);

  public currentRecieverId = signal<string | null>(null);
  public currentReciever = signal<User | null>(null);
  public readonly currentUserId = computed(() => this.authService.currentUser()?.id || '');

  /**
   * Initializes the component and loads the necessary data such as receiver information, messages, users, and channels.
   */
  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.currentRecieverId.set(params.get('id'));
      this.getRecieverFromUrl();
      this.loadDirectChat(this.currentRecieverId() || '');
    });
  }

  unsubDirectMessages?: () => void;

  loadDirectChat(otherUserId: string) {
    if (this.unsubDirectMessages) this.unsubDirectMessages();

    this.unsubDirectMessages = this.messagesService.subToConversationMessages(this.currentUserId(), otherUserId);
  }

  /**
   * Retrieves the receiver's data from Firestore using the receiver ID.
   */
  private async getRecieverFromUrl() {
    if (this.currentRecieverId) {
      const docRef = this.firestoreService.getDocRef('users', this.currentRecieverId() || '');
      if (docRef) {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          this.currentReciever.set({ id: docSnap.id, ...data } as User);
        }
      }
    }
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
    return this.currentRecieverId() === this.currentUserId();
  }

  /**
   * Displays the receiver's profile.
   */
  public showProfile() {
    this.dialog.open(DialogReciverComponent, {
      data: {
        reciever: this.currentReciever,
        recieverId: this.currentRecieverId(),
      },
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
