import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../shared.service';
import { FireServiceService } from '../fire-service.service';
import { Firestore, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Message } from '../models/message';

@Component({
  selector: 'app-thread',
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './thread.component.html',
  styleUrls: ['./thread.component.scss'],
})
export class ThreadComponent implements OnInit {
  firestore: Firestore = inject(Firestore);
  userService: UserService = inject(UserService);
  fireService: FireServiceService = inject(FireServiceService);
  route: ActivatedRoute = inject(ActivatedRoute);
  router: Router = inject(Router);

  currentUser: any;
  userId: string = '';
  currentChannel: any;
  currentChannelId: string = '';
  parentMessageId: string = '';
  input: string = '';
  parentMessageData: any = null;

  editingMessageId: number = 0;

  isMobile: boolean = false;
  listOpen: boolean = false;
  isChannel: boolean = false;
  isEditing: boolean = false;
  menuOpen: boolean = false;
  reactionMenuOpenInTextarea: boolean = false;
  reactionMenuOpenInFooter: boolean = false;
  reactionMenuOpen: boolean = false;
  reactionMenuOpenInBar: boolean = false;
  showAllReactions: boolean = false;

  messages: any = [];
  reactions: any = [];
  currentList: any = [];

  emojis: string[] = [
    'emoji _nerd face_',
    'emoji _person raising both hands in celebration_',
    'emoji _rocket_',
    'emoji _white heavy check mark_',
  ];

  unsubMessages!: () => void;

  async ngOnInit() {
    this.route.queryParams.subscribe(async (params) => {
      this.currentChannelId = params['id'] || '';
      this.parentMessageId = params['messageId'] || '';
      await this.getCurrentChannel();
      this.getThreadParentMessage();
      this.getMessages();
      this.currentUser = this.userService.currentUser;
      this.userId = this.userService.reciepentId;
    });
  }

  async getCurrentChannel() {
    if (this.currentChannelId) {
      let channelRef = doc(this.firestore, `channels/${this.currentChannelId}`);
      let channelRefDocSnap = await getDoc(channelRef);
      channelRefDocSnap.exists() ? (this.currentChannel = channelRefDocSnap.data()) : null;
    }
  }

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

  getMessages() {
    if (this.parentMessageId) {
      let threadRef = collection(this.firestore, `channels/${this.currentChannelId}/messages/${this.parentMessageId}/thread`);
      let threadQuery = query(threadRef, orderBy('timestamp', 'asc'));

      onSnapshot(threadQuery, (snapshot) => {
        this.messages = this.userService.processData(snapshot);
      });
    }
  }

  sendMessage() {
    if (this.input.trim() !== '') {
      this.fireService.sendThreadMessage(
        this.currentChannelId,
        new Message(this.userService.buildMessageObject(this.input, this.messages, this.reactions)),
        this.parentMessageId
      );
      this.input = '';
    }
  }

  closeThread() {
    if (this.userService.isMobile) {
      this.router.navigate(['/channel'], {
        queryParams: { channelType: 'channel', id: this.currentChannelId, reciepentId: this.userService.docId },
      });
    }
    this.userService.toggleThread('close');
  }

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

  openReciver(i: number, key: string) {
    if (this.isChannel) {
      this.userService.setUrl('channel', key);
      this.userService.getChannel(this.currentList[i], this.currentUser);
      this.userService.loadComponent('channel');
    } else {
      this.userService.setUrl('direct', this.userId, key);
      this.userService.getReciepent(this.currentList[i], this.currentUser);
      this.userService.loadComponent('chat');
    }
    this.resetList();
    this.userService.toggleThread('close');
  }

  resetList() {
    this.currentList = [];
    this.listOpen = false;
    this.input = '';
  }

  editMessage(message: Message, index: number) {
    this.menuOpen = false;
    this.isEditing = true;
    this.editingMessageId = index;
    // this.inputEdit = message.message;
  }

  addReaction(message: any, emoji: string) {
    let messageRef = this.fireService.getMessageThreadRef(this.currentChannelId, this.parentMessageId, message.id);
    let newReaction = { emoji: emoji, from: this.userId || 'Unbekannt' };
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

  addEmoji(emoji: string) {
    this.reactions = [];
    let newReaction = { emoji: emoji, from: this.userId || 'Unbekannt' };
    this.reactions.push(newReaction);
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

  ngOnDestroy(): void {
    if (this.unsubMessages) {
      this.unsubMessages();
    }
  }
}
