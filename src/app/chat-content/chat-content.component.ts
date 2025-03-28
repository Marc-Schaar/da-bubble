import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild, Injectable, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Firestore, onSnapshot, serverTimestamp, query, orderBy, updateDoc } from '@angular/fire/firestore';
import { FireServiceService } from '../fire-service.service';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Message } from '../models/message';
import { UserService } from '../shared.service';
import { ChannelEditComponent } from '../chat-content/channel-edit/channel-edit.component';
import { AddMemberComponent } from './add-member/add-member.component';
import { doc, getDoc } from '@firebase/firestore';

// @Injectable({
//   providedIn: 'root',
// })
@Component({
  selector: 'app-chat-content',
  imports: [MatIconModule, MatButtonModule, CommonModule, FormsModule, MatSidenavModule, ChannelEditComponent, AddMemberComponent],
  templateUrl: './chat-content.component.html',
  styleUrl: './chat-content.component.scss',
})
export class ChatContentComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chatContent') chatContentRef!: ElementRef;
  private subscriptions = new Subscription();

  fireService: FireServiceService = inject(FireServiceService);
  userService: UserService = inject(UserService);
  router: Router = inject(Router);
  firestore: Firestore = inject(Firestore);

  loading: boolean = false;
  menuOpen: boolean = false;
  reactionMenuOpen: boolean = false;
  reactionMenuOpenInFooter: boolean = false;
  isEditing: boolean = false;
  isMobile: boolean = false;
  showAllReactions: boolean = false;

  channels: any = [];
  messages: any[] = [];
  currentChannel: any = {};
  reactions: string[] = [];
  currentList: any[] = [];

  currentUser: any;
  userId: string = '';
  editingMessageId: any = '';
  input: string = '';
  inputEdit: string = '';
  currentChannelId: string = '';
  channelInfo: boolean = false;
  addMemberWindow: boolean = false;

  emojis: string[] = [
    'emoji _nerd face_',
    'emoji _person raising both hands in celebration_',
    'emoji _rocket_',
    'emoji _white heavy check mark_',
  ];

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
    if (this.userService.user != null) {
      this.isMobile = this.userService.checkScreenWidth();
      this.setChannelData();
      this.getMessages();
    } else console.error('keine User oder Channel');
  }

  setChannelData() {
    this.currentChannelId = this.userService.docId;
    this.userId = this.userService.reciepentId;
    // this.currentUser = this.userService.currentUser;
    this.getChannelFromUrl();
  }

  async getChannelFromUrl() {
    if (this.currentChannelId) {
      const docRef = doc(this.firestore, 'channels', this.currentChannelId);
      const docSnap = await getDoc(docRef);
      docSnap.exists() ? (this.currentChannel = docSnap.data()) : null;
    }
  }

  getMessages() {
    let messagesRef = this.fireService.getCollectionRef(`channels/${this.currentChannelId}/messages`);
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
        this.scrollToBottom();
      });
    }
  }

  newMessage(): void {
    this.fireService.sendMessage(this.currentChannelId, new Message(this.buildMessageObject()));
    this.input = '';
  }

  editMessage(message: Message, index: number) {
    this.menuOpen = false;
    this.isEditing = true;
    this.editingMessageId = index;
    this.inputEdit = message.message;
    this.scrollToBottom();
  }

  async updateMessage(message: any) {
    let messageRef = this.fireService.getMessageRef(this.currentChannelId, message.id);
    if (messageRef) {
      this.isEditing = false;
      this.editingMessageId = null;
      try {
        this.fireService.updateMessage(messageRef, this.inputEdit);
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
      reaction: this.reactions || [],
    };
  }

  addReaction(message: any, emoji: string) {
    let messageRef = this.fireService.getMessageRef(this.currentChannelId, message.id);
    let newReaction = { emoji: emoji, from: this.userId || 'Unbekannt' };
    if (!this.hasReacted(newReaction.emoji, message.reaction)) {
      message.reaction.push(newReaction);
      if (messageRef) {
        try {
          this.fireService.updateReaction(messageRef, message.reaction);
          this.reactionMenuOpen = false;
        } catch (error) {
          console.error('Fehler beim Aktualisieren der Nachricht:', error);
        }
      }
    } else this.removeReaction(message, emoji);
  }

  removeReaction(message: any, emoji: string) {
    let messageRef = this.fireService.getMessageRef(this.currentChannelId, message.id);
    let reactionIndex = message.reaction.findIndex((r: any) => r.from === this.userId && r.emoji === emoji);
    if (reactionIndex >= 0) {
      message.reaction.splice(reactionIndex, 1);
      if (messageRef) {
        try {
          this.fireService.updateReaction(messageRef, message.reaction);
        } catch (error) {
          console.error('Fehler beim Aktualisieren der Nachricht:', error);
        }
      }
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      const chatContent = this.chatContentRef.nativeElement as HTMLElement;
      if (chatContent) {
        chatContent.scrollTop = chatContent.scrollHeight;
      }
    }, 0);
  }

  toggleThread() {
    if (this.isMobile) this.router.navigate(['/thread']);
    else this.userService.toggleThread();
  }

  ngAfterViewInit() {
    window.addEventListener('resize', this.userService.checkScreenWidth.bind(this));
  }

  openChannelInfo() {
    this.channelInfo = true;
  }

  openMemberWindow() {
    this.addMemberWindow = true;    
  }

  uniqueEmojis(reactions: any[]): any[] {
    return reactions.filter((reaction, index) => index === reactions.findIndex((r) => r.emoji === reaction.emoji));
  }

  countEmoji(emoji: any, reactions: any[]) {
    return reactions.filter((e) => e.emoji === emoji.emoji).length;
  }

  countUniqueEmojis(iterable: any[]): number {
    return new Set(iterable.map((e) => e.emoji)).size;
  }

  hasReacted(emoji: any, reactions: any[]): boolean {
    return reactions.some((reaction) => reaction.from === this.userId && reaction.emoji === emoji);
  }

  getList() {
    if (this.input.includes('#')) {
      this.currentList = this.channels;
      console.log('Channels', this.userService.channels);

      //  this.isClicked = true;
      //    this.isChannel = true;
    }
    if (this.input.includes('@')) {
      console.log('Users', this.userService.users);

      //  this.isClicked = true;
      // this.currentList = this.users;
      //   this.isChannel = false;
    }
    if (this.input === '' || (!this.input.includes('#') && !this.input.includes('@'))) {
      //  this.isClicked = false;
    }
  }
}
