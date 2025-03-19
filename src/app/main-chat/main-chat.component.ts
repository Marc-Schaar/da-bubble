import { Component, inject, ViewChild, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { ContactbarComponent } from '../contactbar/contactbar.component';
import { Subscription } from 'rxjs';
import { UserService } from '../shared.service';
import { ThreadComponent } from '../thread/thread.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FireServiceService } from '../fire-service.service';
import { query } from '@firebase/firestore';
import { doc, Firestore, onSnapshot, orderBy } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-main-chat',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    CommonModule,
    FormsModule,
    HeaderComponent,
    MatSidenavModule,
    ContactbarComponent,
    ThreadComponent,
  ],
  templateUrl: './main-chat.component.html',
  styleUrl: './main-chat.component.scss',
})
export class MainChatComponent implements OnInit {
  @ViewChild('drawer') drawer!: MatDrawer;
  shareddata = inject(UserService);
  router: Router = inject(Router);
  fireService: FireServiceService = inject(FireServiceService);
  firestore: Firestore = inject(Firestore);
  auth: Auth = inject(Auth);

  showFiller = true;
  isMobile: boolean = false;
  isProfileCard: boolean = false;
  currentReciever: any;
  currentComponent: any;
  private componentSubscription: Subscription | null = null;
  private threadSubscription!: Subscription;
  private subscription!: Subscription;

  //Neue Logik ab hier:

  channelType: string = 'default';
  channelMessages: any = [];
  docId: string = '';
  unsubMessages!: () => void;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.shareddata.dashboard = true;
    this.shareddata.login = false;

    this.componentSubscription = this.shareddata.component$.subscribe(
      (component) => {
        this.currentComponent = component;
        console.log('Aktuelle Komponente:', component);
      }
    );
    this.subscription = this.shareddata.openProfile$.subscribe(() => {
      this.openProfile();
    });

    this.threadSubscription = this.shareddata.threadToggle$.subscribe(() => {
      this.toggleThread();
    });
    this.getUrlData();
  }

  getUrlData() {
    this.route.queryParams.subscribe((params) => {
      this.channelType = params['channelType'] || 'default';
      this.docId = params['id'] || '';
      console.log('Aktueller Channel Typ', this.channelType);

      if (this.docId) this.getChannelMessages();
      else console.log('Default');
    });
  }

  getChannelMessages() {
    if (this.channelType === 'direct') {
      //Direktnachrichten laden und pushen
      // this.loadDirectMessages();
    }
    if (this.channelType == 'channel') {
      //Channelnachrichten laden und pushen
      this.loadChannelMessages();
    } else {
      //Default Neue Nachricht?
    }
  }

  loadChannelMessages() {
    let messagesRef = this.fireService.getCollectionRef(
      `channels/${this.docId}/messages`
    );
    if (messagesRef) {
      let messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
      this.unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
        this.channelMessages = snapshot.docs.map((doc) => {
          let data = doc.data();
          return {
            id: doc.id,
            ...data,
            time: data['timestamp']
              ? new Date(data['timestamp'].toDate()).toLocaleTimeString(
                  'de-DE',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  }
                )
              : '–',
          };
        });
      });
    }
    console.log('Nachrichten aus dem Array der Url', this.channelMessages);
  }

  loadDirectMessages() {
    const messagesRef = doc(
      this.firestore,
      `users/${this.shareddata?.currentUser.id}`
    );
    onSnapshot(messagesRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const messageData = docSnapshot.data();
        const messages = messageData['messages'] || [];
        this.channelMessages = [];
        messages.forEach((message: any) => {
          if (this.shareddata.currentUser.id === this.currentReciever.id) {
            if (
              message['to'] === this.currentReciever.id &&
              message['from'] === this.currentReciever.id
            ) {
              this.channelMessages.push(message);
            }
          } else {
            if (
              message['to'] === this.currentReciever.id ||
              message['from'] === this.currentReciever.id
            ) {
              this.channelMessages.push(message);
            }
          }
        });

        // this.sortMessages();
        // this.checkMessages();
      } else {
        console.log('Benutzerdokument existiert nicht.');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.componentSubscription) {
      this.componentSubscription.unsubscribe();
    }
  }

  toggleThread() {
    this.drawer.toggle();
  }

  closeProfile() {
    this.isProfileCard = false;
  }

  openProfile() {
    this.currentReciever = this.shareddata.currentReciever;
    this.isProfileCard = !this.isProfileCard;
    console.log('OPEN');
    console.log(this.isProfileCard);
  }
}
