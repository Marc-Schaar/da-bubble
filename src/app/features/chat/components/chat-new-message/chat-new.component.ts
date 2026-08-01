import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ChatHeaderComponent } from '../chat-header/chat-header.component';
import { SearchResultComponent } from '../../../../shared/components/search-result/search-result.component';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { SearchService } from '../../../../shared/services/search/search.service';
import { TextareaTemplateComponent } from '../textarea/textarea-template.component';
import { AuthService } from '../../../auth/services/auth/auth.service';
import { isChannel } from '../../../../shared/utils/receiver.util';
import { Channel } from '../../../channel/models/channel/channel';
import { User } from '../../../auth/models/user/user';
import { MessagesService } from '../../services/messages/messages.service';
import { InputComponent } from '../../../../shared/components/input/input.component';

@Component({
  selector: 'app-newmessage',
  imports: [
    CommonModule,
    FormsModule,
    TextareaTemplateComponent,
    MatIconModule,
    ChatHeaderComponent,
    SearchResultComponent,
    InputComponent,
  ],
  templateUrl: './chat-new.component.html',
  styleUrl: './chat-new.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewmessageComponent {
  public navigationService: NavigationService = inject(NavigationService);
  public searchService: SearchService = inject(SearchService);
  public authService: AuthService = inject(AuthService);
  private messagesService: MessagesService = inject(MessagesService);

  public currentReceiver: Channel | User | null = null;
  private receiverType: 'channel' | 'direct' | null = null;
  private receiverId: string = 'null';
  public input: string = '';

  protected readonly isChannel = isChannel;

  @ViewChild(SearchResultComponent) private searchResultRef?: SearchResultComponent;

  protected readonly listboxId = 'chat-new-receiver-listbox';

  /** Arrow/Enter/Escape navigation for the receiver suggestion dropdown; only active while it's actually open. */
  protected onSearchKeydown(event: KeyboardEvent): void {
    if (!this.searchService.getNewListBoolean()) return;
    this.searchService.handleDropdownKeydown(event, () => this.searchResultRef?.selectHighlighted());
  }

  protected activeDescendantId(): string | null {
    const index = this.searchService.getHighlightedIndex();
    return this.searchService.getNewListBoolean() && index >= 0 ? `${this.listboxId}-option-${index}` : null;
  }

  /**
   * Sets the current receiver of the message, determines the receiver type (channel or direct),
   * resets the search list, and logs relevant information.
   *
   * @param element - The receiver element, either a channel or a user.
   */
  setReceiver(element: Channel | User): void {
    this.currentReceiver = element;
    this.receiverId = element.id!;

    isChannel(element) ? this.setReceiverType('channel') : this.setReceiverType('direct');
    this.searchService.resetList();
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
    const receiver = this.currentReceiver;
    if (!receiver) return '';
    return isChannel(receiver) ? receiver.name : receiver.displayName;
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

  /**
   * Sends the first message of a new conversation to the chosen receiver,
   * dispatching to the channel or direct-message send based on receiver type.
   */
  public onSend(text: string): void {
    const type = this.getReceiverType();
    const id = this.getReceiverId();
    if (type === 'channel') this.messagesService.sendChannelMessage(text, id);
    else if (type === 'direct') this.messagesService.sendDirectMessage(text, id);
  }
}
