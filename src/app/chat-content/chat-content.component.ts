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
} from '@angular/fire/firestore';
import { FireServiceService } from '../fire-service.service';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
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

  unsubMessages!: () => void;

  async ngOnInit() {
    if (!this.userService.auth.currentUser) this.router.navigate(['/main']);
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
    if (
      this.userService.user != null &&
      this.userService.currentChannel != null
    ) {
      this.isMobile = this.userService.checkScreenWidth();
      this.setCurrentChannel();
      this.getMessages();
      console.log(this.currentChannel);
      console.log(this.currentUser);
    } else {
      console.log('keine User oder Channel');
    }
  }

  setCurrentChannel() {
    this.currentChannel = this.userService.currentChannel;
    this.currentUser = this.userService.currentUser;
  }

  getMessages() {
    let messagesRef = this.getCollectionRef(
      `channels/${this.currentChannel.id}/messages`
    );
    if (messagesRef) {
      this.unsubMessages = onSnapshot(messagesRef, (snapshot) => {
        this.messages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log(this.messages);
        this.scrollToBottom();
      });
    }
    return;
  }

  async newMessage() {
    let messagesCollectionRef = this.getCollectionRef(
      `channels/${this.currentChannel.id}/messages`
    );

    if (messagesCollectionRef) {
      this.loading = true;
      try {
        await addDoc(
          messagesCollectionRef,
          new Message(this.buildMessageObject()).toJSON()
        );
        this.loading = false;
        this.scrollToBottom();
        this.input = '';
      } catch (err) {
        console.error('Fehler beim Senden der Nachricht:', err);
      }
    }
  }

  editMessage(message: any, index: number) {
    this.menuOpen = false;
    this.isEditing = true;
    this.editingMessageId = index;
    this.inputEdit = message.message;
    this.scrollToBottom();
  }

  async updateMessage(message: any) {
    let messageRef = this.getDocRef(
      `channels/${this.currentChannel.id}/messages`,
      message.id
    );

    if (messageRef) {
      this.isEditing = false;
      this.editingMessageId = null;

      try {
        await updateDoc(messageRef, {
          message: this.inputEdit,
        });
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
      time: (new Date().getHours() + ':' + new Date().getMinutes()).toString(),
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

  getDocRef(ref: string, id: string) {
    return ref && id ? doc(this.fireService.firestore, ref, id) : null;
  }

  getCollectionRef(ref: string) {
    return ref ? collection(this.fireService.firestore, ref) : null;
  }

  ngAfterViewInit() {
    window.addEventListener(
      'resize',
      this.userService.checkScreenWidth.bind(this)
    );
  }
}
