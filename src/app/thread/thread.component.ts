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

@Component({
  selector: 'app-thread',
  imports: [CommonModule, FormsModule, MatIconModule, RouterLink, TextareaTemplateComponent],
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
  menuOpen: boolean = false;
  reactionMenuOpenInFooter: boolean = false;
  reactionMenuOpen: boolean = false;
  reactionMenuOpenInBar: boolean = false;
  showAllReactions: boolean = false;
  messages: any = [];
  reactions: any = [];
  emojis: string[] = [
    'emoji _nerd face_',
    'emoji _person raising both hands in celebration_',
    'emoji _rocket_',
    'emoji _white heavy check mark_',
  ];

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

  /**
   * Starts editing a message.
   * @param message - The message to edit.
   * @param index - The index of the message being edited.
   */
  editMessage(message: Message, index: number) {
    this.menuOpen = false;
    this.isEditing = true;
    this.editingMessageId = index;
    this.inputEdit = message.message;
  }

  /**
   * Updates the message after editing.
   * @param message - The message to update.
   */
  async updateMessage(message: any) {
    let messageRef = this.fireService.getMessageThreadRef(this.currentChannelId, this.parentMessageId, message.id);
    if (messageRef) {
      this.isEditing = false;
      this.editingMessageId = null;
      try {
        this.fireService.updateMessage(messageRef, this.inputEdit);
        this.inputEdit = '';
      } catch (error) {
        console.error('Fehler beim Aktualisieren der Nachricht:', error);
      }
    }
  }

  /**
   * Cancels the edit process and closes the menu.
   */
  cancel() {
    this.isEditing = false;
    this.editingMessageId = null;
    this.menuOpen = false;
  }

  /**
   * Adds a reaction (emoji) to a message.
   * @param message - The message to react to.
   * @param emoji - The emoji to add as a reaction.
   */
  addReaction(message: any, emoji: string) {
    let messageRef = this.fireService.getMessageThreadRef(this.currentChannelId, this.parentMessageId, message.id);
    let newReaction = { emoji: emoji, from: this.userId || 'Gast' };
    if (!this.hasReacted(newReaction.emoji, message.reaction)) {
      message.reaction.push(newReaction);
      if (messageRef) {
        try {
          this.fireService.updateReaction(messageRef, message.reaction);
          this.reactionMenuOpen = false;
        } catch (error) {
          console.error('Fehler beim Aktualisieren der Nachricht:', error);
        }
      }
    } else this.removeReaction(message, emoji);
  }

  /**
   * Removes a reaction (emoji) from a message.
   * @param message - The message to remove the reaction from.
   * @param emoji - The emoji to remove.
   */
  removeReaction(message: any, emoji: string) {
    let messageRef = this.fireService.getMessageThreadRef(this.currentChannelId, this.parentMessageId, message.id);
    let reactionIndex = message.reaction.findIndex((r: any) => r.from === this.userId && r.emoji === emoji);
    if (reactionIndex >= 0) {
      message.reaction.splice(reactionIndex, 1);
      if (messageRef) {
        try {
          this.fireService.updateReaction(messageRef, message.reaction);
        } catch (error) {
          console.error('Fehler beim Aktualisieren der Nachricht:', error);
        }
      }
    }
  }

  uniqueEmojis(reactions: any[]): any[] {
    return reactions.filter((reaction, index) => index === reactions.findIndex((r) => r.emoji === reaction.emoji));
  }

  countEmoji(emoji: any, reactions: any[]) {
    return reactions.filter((e) => e.emoji === emoji.emoji).length;
  }

  countUniqueEmojis(iterable: any[]): number {
    return new Set(iterable.map((e) => e.emoji)).size;
  }

  hasReacted(emoji: any, reactions: any[]): boolean {
    return reactions.some((reaction) => reaction.from === this.userId && reaction.emoji === emoji);
  }

  getReactionNamesForEmoji(targetEmoji: string, reactions: any[]): string[] {
    let allUsers = this.userService.users;
    let currentUserId = this.userId;
    let reactionsWithEmoji = reactions.filter((reaction: any) => reaction.emoji === targetEmoji);
    let userIds = reactionsWithEmoji.map((reaction: any) => reaction.from);
    let hasCurrentUserReacted = userIds.includes(currentUserId);

    let otherUsers = allUsers
      .filter((user: any) => userIds.includes(user.key) && user.key !== currentUserId)
      .map((user: any) => user.fullname);

    if (hasCurrentUserReacted) {
      if (otherUsers.length === 0) return ['Du'];
      else otherUsers.push('und du');
    }
    return otherUsers;
  }

  ngOnDestroy(): void {
    if (this.unsubMessages) {
      this.unsubMessages();
    }
  }
}
