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
  messages: any[] = [];

  ngOnInit(): void {
    this.currentChannelId = this.userService.docId;
    this.getThreadMessages();
  }

  getThreadMessages() {
    console.log('Channel ID:', this.currentChannelId);
    let messagesRef = this.fireService.getCollectionRef(`channels/${this.currentChannelId}/messages/`);
    if (messagesRef) {
      let messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

      this.unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
        this.messages = snapshot.docs.map((doc) => {
          let data = doc.data();
          return {
            id: doc.id,
            ...data,
            time: data['timestamp']
              ? new Date(data['timestamp'].toDate()).toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '–',
          };
        });
        console.log('Nachrichten', this.messages);

        this.scrollToBottom();
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
