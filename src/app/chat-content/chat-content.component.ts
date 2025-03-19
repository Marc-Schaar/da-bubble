import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
  Injectable,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  updateDoc,
  onSnapshot,
  collection,
  doc,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
} from '@angular/fire/firestore';
import { FireServiceService } from '../fire-service.service';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { Subscription, timestamp } from 'rxjs';
import { Message } from '../models/message';
import { UserService } from '../shared.service';

@Injectable({
  providedIn: 'root',
})
@Component({
  selector: 'app-chat-content',
  imports: [
    MatIconModule,
    MatButtonModule,
    CommonModule,
    FormsModule,
    MatSidenavModule,
  ],
  templateUrl: './chat-content.component.html',
  styleUrl: './chat-content.component.scss',
})
export class ChatContentComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chatContent') chatContentRef!: ElementRef;
  private subscriptions = new Subscription();

  fireService: FireServiceService = inject(FireServiceService);
  userService: UserService = inject(UserService);
  router: Router = inject(Router);

  loading: boolean = false;
  menuOpen: boolean = false;
  isEditing: boolean = false;
  isMobile: boolean = false;

  channels: any = [];
  messages: any[] = [];
  currentChannel: any = {};

  currentUser: any;
  editingMessageId: any = '';
  input: string = '';
  inputEdit: string = '';
  currentChannelId: any;

  unsubMessages!: () => void;

  async ngOnInit() {
    // if (!this.userService.auth.currentUser) this.router.navigate(['/main']);
    this.startChannel();
    this.subscriptions.add(
      this.userService.startLoadingChannel$.subscribe(() => {
        this.startChannel();
      })
    );

    this.subscriptions.add(
      this.userService.screenWidth$.subscribe((isMobile) => {
        this.isMobile = isMobile;
        console.log('Ist Mobile Ansicht aktiv?:', this.isMobile);
      })
    );
  }

  ngOnDestroy() {
    if (this.subscriptions) this.subscriptions.unsubscribe();
  }

  startChannel() {
    console.log('start');
    if (this.userService.user != null) {
      this.isMobile = this.userService.checkScreenWidth();

      this.setChannelData();
      this.getMessages();
    } else console.error('keine User oder Channel');
  }

  setChannelData() {
    this.currentChannel = this.userService.currentChannel;
    this.currentChannelId = this.userService.docId;
    this.currentUser = this.userService.currentUser;
  }

  getMessages() {
    let messagesRef = this.fireService.getCollectionRef(
      `channels/${this.currentChannelId}/messages`
    );
    if (messagesRef) {
      let messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

      this.unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
        this.messages = snapshot.docs.map((doc) => {
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
        this.scrollToBottom();
      });
    }
  }

  newMessage(): void {
    this.fireService.sendMessage(
      this.currentChannelId,
      new Message(this.buildMessageObject())
    );
  }

  editMessage(message: Message, index: number) {
    this.menuOpen = false;
    this.isEditing = true;
    this.editingMessageId = index;
    this.inputEdit = message.message;
    this.scrollToBottom();
  }

  async updateMessage(message: any) {
    let messageRef = this.fireService.getMessageRef(
      this.currentChannelId,
      message.id
    );
    if (messageRef) {
      this.isEditing = false;
      this.editingMessageId = null;
      try {
        this.fireService.updateMessage(messageRef, this.inputEdit);
        console.log('Nachricht erfolgreich aktualisiert');
        this.inputEdit = '';
      } catch (error) {
        console.error('Fehler beim Aktualisieren der Nachricht:', error);
      }
    }
  }

  cancel() {
    this.isEditing = false;
    this.editingMessageId = null;
    this.menuOpen = false;
  }

  isNewDay(): boolean {
    if (this.messages.length === 0) return true;
    let lastMessage = this.messages[this.messages.length - 1];
    let lastMessageDate = lastMessage.date;
    let todayDate = new Date().toISOString().split('T')[0];

    return lastMessageDate !== todayDate;
  }

  isToday(date: any): boolean {
    if (!date) return false;
    let today = new Date().toISOString().split('T')[0];
    let messageDate = new Date(date).toISOString().split('T')[0];
    return today === messageDate;
  }

  buildMessageObject(): {} {
    return {
      message: this.input || '',
      avatar: this.userService.user?.photoURL || '',
      date: new Date().toISOString().split('T')[0],
      name: this.userService.user?.displayName || 'Unbekannt',
      newDay: this.isNewDay(),
      timestamp: serverTimestamp(),
    };
  }

  scrollToBottom() {
    setTimeout(() => {
      const chatContent = this.chatContentRef.nativeElement as HTMLElement;
      if (chatContent) {
        chatContent.scrollTop = chatContent.scrollHeight;
      }
    }, 0);
  }

  toogleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleThread() {
    if (this.isMobile) this.router.navigate(['/thread']);
    else this.userService.toggleThread();
  }

  ngAfterViewInit() {
    window.addEventListener(
      'resize',
      this.userService.checkScreenWidth.bind(this)
    );
  }
}
