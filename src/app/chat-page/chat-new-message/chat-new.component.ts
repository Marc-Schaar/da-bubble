import { CommonModule } from '@angular/common';
import { Component, inject, Injectable } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TextareaTemplateComponent } from '../../shared/textarea/textarea-template.component';
import { ChatHeaderComponent } from '../../shared/chat-header/chat-header.component';
import { SearchResultComponent } from '../../shared/search-result/search-result.component';
import { UserService } from '../../services/user/shared.service';
import { FireServiceService } from '../../services/firebase/fire-service.service';
import { MessagesService } from '../../services/messages/messages.service';
import { NavigationService } from '../../services/navigation/navigation.service';
import { SearchService } from '../../services/search/search.service';
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

  /**
   * Sets the current receiver of the message, determines the receiver type (channel or direct),
   * resets the search list, and logs relevant information.
   *
   * @param element - The receiver element, either a channel or a user.
   */
  setReceiver(element: any): void {
    this.currentReceiver = element;
    this.receiverId = element.key || element.id;

    this.isChannel(element) ? this.setReceiverType('channel') : this.setReceiverType('direct');
    this.searchService.resetList();
  }

  /**
   * Determines whether the provided element is a channel based on its data structure.
   *
   * @param element - The element to check.
   * @returns True if the element is a channel, false otherwise.
   */
  public isChannel(element: any): boolean {
    return element.data?.member;
  }

  /**
   * Sets the receiver type to either 'channel' or 'direct'.
   *
   * @param type - The type of the receiver.
   */
  public setReceiverType(type: 'channel' | 'direct'): void {
    this.receiverType = type;
  }

  /**
   * Retrieves the name of the current receiver.
   *
   * @returns The name of the current receiver, or an empty string if not available.
   */
  public getReceiverName(): string {
    let receiverName = this.currentReceiver?.data?.name || this.currentReceiver?.fullname || '';
    return receiverName;
  }

  /**
   * Retrieves the type of the current receiver.
   *
   * @returns The receiver type: 'channel' or 'direct'.
   */
  public getReceiverType(): 'channel' | 'direct' | null {
    return this.receiverType;
  }

  /**
   * Retrieves the ID of the current receiver.
   *
   * @returns The receiver ID.
   */
  public getReceiverId(): string {
    return this.receiverId;
  }
}
