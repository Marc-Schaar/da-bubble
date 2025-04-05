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

  isMobile: boolean = false;
  listOpen: boolean = false;
  isChannel: boolean = false;

  messages: any = [];
  reactions: [] = [];
  currentList: any = [];

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

  ngOnDestroy(): void {
    if (this.unsubMessages) {
      this.unsubMessages();
    }
  }
}
