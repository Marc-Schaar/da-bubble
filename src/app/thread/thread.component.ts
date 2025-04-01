import { Component, inject, OnInit } from '@angular/core';
import { UserService } from '../shared.service';
import { FireServiceService } from '../fire-service.service';
import { query } from '@firebase/firestore';
import { onSnapshot, orderBy } from '@angular/fire/firestore';

@Component({
  selector: 'app-thread',
  imports: [],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss',
})
export class ThreadComponent implements OnInit {
  constructor() {}

  unsubMessages!: () => void;

  userService: UserService = inject(UserService);
  fireService: FireServiceService = inject(FireServiceService);

  currentChannelId: string = '';
  parentMessageData: any;

  ngOnInit(): void {
    this.currentChannelId = this.userService.docId;
    this.getThreadParentMessage();
  }

  getThreadParentMessage() {
    let threadRef = this.fireService.getCollectionRef(`channels/${this.currentChannelId}/messages/96qllxMUoVOKdGlZs4AP/thread`);

    if (threadRef) {
      onSnapshot(threadRef, (snapshot) => {
        if (!snapshot.empty) {
          let doc = snapshot.docs[0];
          let data = doc.data();

          this.parentMessageData = {
            id: doc.id,
            ...data,
            time: data['timestamp']
              ? new Date(data['timestamp'].toDate()).toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '–',
          };
        }
        console.log('threadParentMessage:', this.parentMessageData);
      });
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      // const chatContent = this.chatContentRef.nativeElement as HTMLElement;
      // if (chatContent) {
      //   chatContent.scrollTop = chatContent.scrollHeight;
      // }
    }, 0);
  }
}
