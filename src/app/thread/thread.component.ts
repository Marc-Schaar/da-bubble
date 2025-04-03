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

  currentChannelId: string = '';
  parentMessageId: string = '';
  parentMessageData: any = null;
  isMobile: boolean = false;

  unsubMessages!: () => void;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.currentChannelId = params['id'] || '';
      this.parentMessageId = params['messageId'] || '';
      this.getThreadParentMessage();
    });
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
    this.userService.toggleThread();
  }

  ngOnDestroy(): void {
    if (this.unsubMessages) {
      this.unsubMessages();
    }
  }
}
