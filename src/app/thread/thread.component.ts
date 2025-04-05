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

  currentChannel: any;
  currentChannelId: string = '';
  parentMessageId: string = '';
  input: string = '';
  parentMessageData: any = null;

  isMobile: boolean = false;

  messages: any = [];
  reactions: [] = [];

  unsubMessages!: () => void;

  async ngOnInit() {
    this.route.queryParams.subscribe(async (params) => {
      this.currentChannelId = params['id'] || '';
      this.parentMessageId = params['messageId'] || '';
      await this.getCurrentChannel();
      this.getThreadParentMessage();
      this.getMessages();
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
    this.fireService.sendThreadMessage(
      this.currentChannelId,
      new Message(this.userService.buildMessageObject(this.input, this.messages, this.reactions)),
      this.parentMessageId
    );
    this.input = '';
  }

  closeThread() {
    if (this.userService.isMobile) {
      this.router.navigate(['/channel'], {
        queryParams: { channelType: 'channel', id: this.currentChannelId, reciepentId: this.userService.docId },
      });
    }
    this.userService.toggleThread('close');
  }

  ngOnDestroy(): void {
    if (this.unsubMessages) {
      this.unsubMessages();
    }
  }
}
