import { Component, inject, OnInit } from '@angular/core';
import { UserService } from '../shared.service';
import { FireServiceService } from '../fire-service.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-thread',
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
  parentMessageData: any = null;
  isMobile: boolean = false;

  unsubMessages!: () => void;

  async ngOnInit() {
    this.route.queryParams.subscribe(async (params) => {
      this.currentChannelId = params['id'] || '';
      this.parentMessageId = params['messageId'] || '';
      this.currentChannel = await this.getCurrentChannel();
      this.getThreadParentMessage();
    });
  }

  async getCurrentChannel() {
    if (this.currentChannelId) {
      try {
        let channelRef = doc(this.firestore, `channels/${this.currentChannelId}`);
        let channelRefDocSnap = await getDoc(channelRef);
        if (channelRefDocSnap.exists()) return channelRefDocSnap.data();
        else return null;
      } catch (error) {
        console.error(' Fehler beim Abrufen des Channels:', error);
        throw error;
      }
    } else return null;
  }

  async getThreadParentMessage() {
    if (this.parentMessageId) {
      try {
        let parentMessageDocRef = doc(this.firestore, `channels/${this.currentChannelId}/messages/${this.parentMessageId}`);
        let parentMessageDocSnap = await getDoc(parentMessageDocRef);

        if (parentMessageDocSnap.exists()) {
          let data = parentMessageDocSnap.data();
          this.setParentMessageData(data);
        }
      } catch (error) {
        console.error(' Fehler beim Abrufen der Parent Message:', error);
      }
    }
  }

  setParentMessageData(data: any) {
    let parentMessage = data;
    let formattedTime = new Date(parentMessage?.timestamp.toDate()).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
    this.parentMessageData = {
      id: this.parentMessageId,
      ...parentMessage,
      time: formattedTime,
    };
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
