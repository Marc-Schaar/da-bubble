import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { UserService } from '../shared.service';
import { FireServiceService } from '../fire-service.service';
import { onSnapshot, QuerySnapshot } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-thread',
  templateUrl: './thread.component.html',
  styleUrls: ['./thread.component.scss'],
})
export class ThreadComponent implements OnInit, OnDestroy {
  unsubMessages!: () => void;
  urlDataSubscription!: Subscription;

  userService: UserService = inject(UserService);
  fireService: FireServiceService = inject(FireServiceService);
  route: ActivatedRoute = inject(ActivatedRoute);
  router: Router = inject(Router);

  currentChannelId: string = '';
  parentMessageId: string = '';
  parentMessageData: any = null;
  isMobile: boolean = false;

  ngOnInit(): void {
    this.setUrlData();
    this.userService.screenWidth$.subscribe((isMobile) => {
      this.isMobile = isMobile;
      console.log('Ist Mobile Ansicht aktiv?:', this.isMobile);
    });
  }

  ngOnDestroy(): void {
    if (this.urlDataSubscription) {
      this.urlDataSubscription.unsubscribe();
    }
    if (this.unsubMessages) {
      this.unsubMessages();
    }
  }

  setUrlData() {
    this.urlDataSubscription = this.route.queryParams.subscribe((params) => {
      this.currentChannelId = params['id'] || '';
      this.parentMessageId = params['messageId'] || '';

      this.getThreadParentMessage();
    });
  }

  getThreadParentMessage() {
    let threadRef = this.fireService.getCollectionRef(`channels/${this.currentChannelId}/messages/${this.parentMessageId}/thread`);

    if (threadRef) {
      this.unsubMessages = onSnapshot(threadRef, (snapshot) => {
        if (!snapshot.empty) {
          let doc = snapshot.docs[0];
          let data = doc.data();
          this.parentMessageData = {
            id: doc.id,
            ...data,
            time: new Date(data['parentMessage']?.timestamp.toDate()).toLocaleTimeString('de-DE', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };
        }
      });
    }
  }

  closeThread() {
    {
      if (this.isMobile)
        this.router.navigate(['/chat'], {
          queryParams: { channelType: 'channel', id: this.currentChannelId, reciepentId: this.userService.docId },
        });
      this.userService.toggleThread();
    }
  }
}
