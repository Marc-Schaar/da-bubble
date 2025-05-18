import { CommonModule } from '@angular/common';
import { Component, inject, Injectable, Input } from '@angular/core';
import { UserService } from '../services/user/shared.service';
import { FireServiceService } from '../services/firebase/fire-service.service';
import { Firestore, arrayUnion, doc, updateDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Message } from '../models/message/message';
import { DirectMessage } from '../models/direct-message/direct-message';
import { NavigationService } from '../services/navigation/navigation.service';
import { MessagesService } from '../services/messages/messages.service';
import { TextareaTemplateComponent } from '../shared/textarea/textarea-template.component';
import { MatIconModule } from '@angular/material/icon';
import { ChatHeaderComponent } from '../shared/chat-header/chat-header.component';
import { SearchService } from '../services/search/search.service';
import { SearchResultComponent } from '../shared/search-result/search-result.component';
@Injectable({
  providedIn: 'root',
})
@Component({
  selector: 'app-newmessage',
  imports: [CommonModule, FormsModule, TextareaTemplateComponent, MatIconModule, ChatHeaderComponent, SearchResultComponent],
  templateUrl: './chat-new.component.html',
  styleUrl: './chat-new.component.scss',
})
export class NewmessageComponent {
  public userService = inject(UserService);
  private firestoreService = inject(FireServiceService);
  private messageService: MessagesService = inject(MessagesService);
  public navigationService: NavigationService = inject(NavigationService);
  public searchService: SearchService = inject(SearchService);

  public currentReceiver: any = '';
  private receiverType: 'channel' | 'direct' | null = null;
  private receiverId: string = 'null';
  public input: string = '';

  /**
   * ngOnInit lifecycle hook to load channels, users and set the current user.
   */
  async ngOnInit() {
    if (!this.navigationService.isInitialize) {
      this.navigationService.initialize();
    }
  }

  setReceiver(element: any) {
    this.currentReceiver = element;
    this.receiverId = element.key || element.id;

    this.isChannel(element) ? this.setReceiverType('channel') : this.setReceiverType('direct');
    this.searchService.resetList();
    console.log(this.currentReceiver);
    console.log('receiverId gesetzt auf:', this.receiverId);
  }

  public isChannel(element: any) {
    return element.data?.member;
  }

  public setReceiverType(type: 'channel' | 'direct') {
    this.receiverType = type;
  }

  public getReceiverName() {
    let receiverName = this.currentReceiver?.data?.name || this.currentReceiver?.fullname || '';
    return receiverName;
  }

  public getReceiverType() {
    return this.receiverType;
  }

  public getReceiverId() {
    return this.receiverId;
  }
}
