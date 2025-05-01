import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Firestore, onSnapshot, query, orderBy, collection, doc, getDoc } from '@angular/fire/firestore';
import { FireServiceService } from '../fire-service.service';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserService } from '../shared.service';
import { ChannelEditComponent } from '../chat-content/channel-edit/channel-edit.component';
import { AddMemberComponent } from './add-member/add-member.component';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MessagesService } from '../service/messages/messages.service';
import { User } from '../models/user/user';
import { NavigationService } from '../service/navigation/navigation.service';
import { DividerTemplateComponent } from '../shared/divider/divider-template.component';
import { Message } from '../models/message/message';

// @Injectable({
//   providedIn: 'root',
// })
@Component({
  selector: 'app-chat-content',
  imports: [
    MatIconModule,
    MatButtonModule,
    CommonModule,
    FormsModule,
    MatSidenavModule,
    RouterLink,
    MatMenuModule,
    MatDialogModule,
    DividerTemplateComponent,
  ],
  templateUrl: './chat-content.component.html',
  styleUrl: './chat-content.component.scss',
})
export class ChatContentComponent implements OnInit, OnDestroy {
  @ViewChild('chatContent') chatContentRef!: ElementRef;
  private subscriptions = new Subscription();
  fireService: FireServiceService = inject(FireServiceService);
  userService: UserService = inject(UserService);
  router: Router = inject(Router);
  firestore: Firestore = inject(Firestore);
  dialog = inject(MatDialog);
  navigationService: NavigationService = inject(NavigationService);
  messagesService: MessagesService = inject(MessagesService);
  route: ActivatedRoute = inject(ActivatedRoute);
  loading: boolean = false;
  menuOpen: boolean = false;
  reactionMenuOpen: boolean = false;
  reactionMenuOpenInFooter: boolean = false;
  reactionMenuOpenInTextarea: boolean = false;
  listOpen: boolean = false;
  isEditing: boolean = false;
  isMobile: boolean = false;
  isChannel: boolean = false;
  showBackground: boolean = false;
  showAllReactions: boolean = false;
  channels: any = [];
  messages: any;
  currentChannel: any = {};
  reactions: any = [];
  currentList: any = [];
  editingMessageId: any = '';
  input: string = '';
  inputEdit: string = '';
  channelInfo: boolean = false;
  addMemberInfoWindow: boolean = false;
  addMemberWindow: boolean = false;
  emojis: string[] = [
    'emoji _nerd face_',
    'emoji _person raising both hands in celebration_',
    'emoji _rocket_',
    'emoji _white heavy check mark_',
  ];
  //Neu für cleancode
  unsubMessages!: () => void;
  currentUser: User = new User(null);
  userId: string = '';
  currentChannelId: string = '';

  /**
   * Initializes the component, loads messages and channel data from URL parameters.
   */
  async ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      this.currentChannelId = params.get('reciverId') || '';
      this.userId = params.get('currentUserId') || '';
      this.getMessages();
      this.getChannelFromUrl();
      this.currentUser = this.userService.currentUser;
    });
  }

  /**
   * Cleans up subscriptions and listeners when the component is destroyed.
   */
  ngOnDestroy() {
    if (this.unsubMessages) this.unsubMessages();
    this.subscriptions.unsubscribe();
  }

  // async getChannelFromUrl() {
  //   if (this.currentChannelId) {
  //     const docRef = doc(this.firestore, 'channels', this.currentChannelId);
  //     const docSnap = await getDoc(docRef);
  //     docSnap.exists() ? (this.currentChannel = docSnap.data()) : null;
  //   }
  // }

  /**
   * Loads the current channel from Firestore based on the channel ID.
   */
  getChannelFromUrl() {
    if (this.currentChannelId) {
      const docRef = doc(this.firestore, 'channels', this.currentChannelId);
      onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          this.currentChannel = { id: docSnap.id, ...docSnap.data() };
        } else {
          this.currentChannel = null;
        }
      });
    }
  }

  /**
   * Retrieves messages for the current channel and loads their threads.
   */
  getMessages() {
    this.unsubMessages = this.messagesService.getChannelMessages(this.currentChannelId, (messages) => {
      this.messages = messages;
      this.messages.forEach((message: any) => {
        this.getThread(message.id);
        this.scrollToBottom();
      });
    });
  }

  /**
   * Loads the thread (replies) for a specific message.
   * @param messageId - ID of the message to load the thread for
   */
  getThread(messageId: string) {
    if (messageId) {
      let threadRef = collection(this.firestore, `channels/${this.currentChannelId}/messages/${messageId}/thread`);
      let threadQuery = query(threadRef, orderBy('timestamp', 'asc'));

      onSnapshot(threadQuery, (snapshot) => {
        const updatedThreads = this.messagesService.processData(snapshot);
        const msgIndex = this.messages.findIndex((m: any) => m.id === messageId);
        if (msgIndex >= 0) this.messages[msgIndex].thread = updatedThreads;
      });
    }
  }

  /**
   * Sends a new message to the current channel.
   */
  newMessage(): void {
    if (this.input.trim() !== '') {
      this.fireService.sendMessage(
        this.currentChannelId,
        new Message(this.messagesService.buildChannelMessageObject(this.input, this.messages, this.reactions))
      );
      this.input = '';
    }
  }

  /**
   * Enables editing mode for a specific message.
   * @param message - The message to edit
   * @param index - Index of the message in the message list
   */
  editMessage(message: Message, index: number) {
    this.menuOpen = false;
    this.isEditing = true;
    this.editingMessageId = index;
    this.inputEdit = message.message;
  }

  /**
   * Updates the content of an edited message.
   * @param message - The message to update
   */
  async updateMessage(message: any) {
    let messageRef = this.fireService.getMessageRef(this.currentChannelId, message.id);
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
   * Cancels editing mode and resets input.
   */
  cancel() {
    this.isEditing = false;
    this.editingMessageId = null;
    this.menuOpen = false;
  }

  /**
   * Adds a reaction to a message or removes it if already reacted.
   * @param message - The message to react to
   * @param emoji - The emoji reaction
   */
  addReaction(message: any, emoji: string) {
    let messageRef = this.fireService.getMessageRef(this.currentChannelId, message.id);
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
   * Removes a specific emoji reaction from a message.
   * @param message - The message to update
   * @param emoji - The emoji to remove
   */
  removeReaction(message: any, emoji: string) {
    let messageRef = this.fireService.getMessageRef(this.currentChannelId, message.id);
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

  /**
   * Adds an emoji to the local reactions array.
   * @param emoji - The emoji to add
   */
  addEmoji(emoji: string) {
    this.reactions = [];
    let newReaction = { emoji: emoji, from: this.userId || 'Gast' };
    this.reactions.push(newReaction);
  }

  /**
   * Scrolls the chat content area to the bottom.
   */
  scrollToBottom() {
    setTimeout(() => {
      const chatContent = this.chatContentRef.nativeElement as HTMLElement;
      if (chatContent) {
        chatContent.scrollTop = chatContent.scrollHeight;
      }
    }, 0);
  }

  /**
   * Opens the thread view for a specific message.
   * @param messageId - ID of the message to open
   * @param $event - The click event
   */
  openThread(messageId: string, $event: Event) {
    if (this.isMobile)
      this.router.navigate(['/thread'], {
        queryParams: {
          channelType: 'channel',
          id: this.currentChannelId,
          reciepentId: this.userService.userId,
          messageId: messageId,
        },
      });
    else this.userService.toggleThread('open');
    $event.stopPropagation();
  }

  /**
   * Opens the dialog to view or edit channel information.
   */
  openChannelInfo() {
    const dialogData = {
      currentChannel: this.currentChannel,
      currentChannelId: this.currentChannelId,
      currentUser: this.currentUser,
    };
    this.dialog.open(ChannelEditComponent, {
      data: dialogData,
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
    const dialogData = {
      currentChannel: this.currentChannel,
      currentChannelId: this.currentChannelId,
      currentUser: this.currentUser,
      addMemberWindow: toggle,
    };
    this.dialog.open(AddMemberComponent, {
      data: dialogData,
      width: 'auto',
      maxWidth: '95vw',
      maxHeight: '90vh',
      height: '413px',

      // height: 'auto',
      panelClass: ['add-member-dialog', 'transparent-dialog-bg'],

      position: { top: '200px', right: '150px' },
    });
  }

  /**
   * Filters unique emojis from the reactions array.
   * @param reactions - Array of emoji reactions
   * @returns Filtered array with unique emojis
   */
  uniqueEmojis(reactions: any[]): any[] {
    return reactions.filter((reaction, index) => index === reactions.findIndex((r) => r.emoji === reaction.emoji));
  }

  /**
   * Counts how many times an emoji was used in a reaction list.
   * @param emoji - The emoji to count
   * @param reactions - The array of reactions
   * @returns Number of times the emoji was used
   */
  countEmoji(emoji: any, reactions: any[]) {
    return reactions.filter((e) => e.emoji === emoji.emoji).length;
  }

  /**
   * Counts how many unique emojis exist in a list.
   * @param iterable - The array to check
   * @returns Count of unique emojis
   */
  countUniqueEmojis(iterable: any[]): number {
    return new Set(iterable.map((e) => e.emoji)).size;
  }

  /**
   * Checks if the user has already reacted with a specific emoji.
   * @param emoji - The emoji to check
   * @param reactions - The list of reactions
   * @returns True if the user has reacted, otherwise false
   */
  hasReacted(emoji: any, reactions: any[]): boolean {
    return reactions.some((reaction) => reaction.from === this.userId && reaction.emoji === emoji);
  }

  /**
   * Handles autocomplete logic for mentions and channels in the input.
   * @param type - Optional preset string to insert
   */
  getList(type?: string): void {
    if (type) this.input = type;
    if (this.input.includes('#') || this.input.includes('@')) {
      if (this.input.includes('#')) {
        this.currentList = this.userService.channels;
        this.isChannel = true;
        this.listOpen = true;
      }

      if (this.input.includes('@')) {
        this.currentList = this.userService.users;
        this.isChannel = false;
        this.listOpen = true;
      }
    } else if (this.input === '') {
      this.currentList = [];
      this.listOpen = false;
    }
  }

  /**
   * Opens a receiver (either a channel or a direct message) based on the input conditions.
   * @param i - The index of the message or item to open
   * @param key - The key identifier for the receiver (channel or direct message)
   */
  openReciver(i: number, key: string) {
    this.isChannel ? this.userService.setUrl('channel', key) : this.userService.setUrl('direct', this.userId, key);
    this.resetList();
  }

  /**
   * Resets the list of items, clears the input, and closes the list.
   */
  resetList() {
    this.currentList = [];
    this.listOpen = false;
    this.input = '';
  }

  /**
   * Returns the names of users who have reacted to a specific emoji.
   * @param targetEmoji - The emoji to check reactions for
   * @param reactions - The list of reactions to check
   * @returns A list of user names who have reacted with the target emoji
   */
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
}
