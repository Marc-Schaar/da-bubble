import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { SearchService } from '../../services/search/search.service';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../services/navigation/navigation.service';
import { Channel } from '../../../features/channel/models/channel/channel';
import { User } from '../../../features/auth/models/user/user';
import { UserListItemComponent } from '../user-list-item/user-list-item.component';
import { isChannel, isUser } from '../../utils/receiver.util';

@Component({
  selector: 'app-search-result',
  imports: [MatIcon, CommonModule, UserListItemComponent],
  templateUrl: './search-result.component.html',
  styleUrl: './search-result.component.scss',
})
export class SearchResultComponent {
  searchService: SearchService = inject(SearchService);
  navigationService: NavigationService = inject(NavigationService);

  @Input() input: string = '';
  @Output() inputChange = new EventEmitter<string>();
  @Output() tagInserted = new EventEmitter<string>();
  @Output() currentReceiver = new EventEmitter<any>();

  /**
   * Tags a receiver (user or channel) in the input field by inserting their name with the tagType.
   * Emits the updated input, then closes and stops observing the search list.
   *
   * @param receiverData - The data object of the receiver (user or channel).
   * @param tagType - The tag symbol to use (e.g., '@' for user, '#' for channel).
   */
  public tagReceiver(receiverData: Channel | User, tagType: '@' | '#') {
    const tagName = isChannel(receiverData) ? receiverData.name : receiverData.displayName;

    this.searchService.isDirectTag() ? this.tagInserted.emit(tagType + tagName) : this.tagInserted.emit(tagName);

    this.searchService.closeList();
    this.searchService.stopObserveInput();
  }

  /**
   * Opens the receiver view depending on whether it's a channel or a user.
   *
   * @param element - The selected receiver element (channel or user).
   */
  public openReceiver(element: Channel | User) {
    this.searchService.isChannel.set(isChannel(element));
    isChannel(element) ? this.openChannel(element) : this.openUser(element);
  }

  /**
   * Opens a direct user chat view and resets the search list.
   *
   * @param element - The user element to open.
   */
  private openUser(element: User) {
    this.navigationService.selectDirectMessageRecipient(element.id);
    this.searchService.resetList();
  }

  /**
   * Opens a channel view and resets the search list.
   *
   * @param element - The channel element to open.
   */
  private openChannel(element: Channel) {
    this.navigationService.selectChannel(element.id!);
    this.searchService.resetList();
  }

  /**
   * Sets the current receiver.
   */
  setReceiver(element: Channel | User) {
    this.currentReceiver.emit(element);
    this.searchService.resetList();
  }

  protected readonly isChannel = isChannel;
  protected readonly isUser = isUser;

  /**
   * Handles the click event on an element.
   * If the header list is open, opens the receiver view;
   * otherwise tags the receiver in the input field.
   *
   * @param element - The clicked element (user or channel).
   */
  public handleClick(element: Channel | User) {
    switch (this.searchService.getSearchComponent()) {
      case 'header':
        this.openReceiver(element);
        break;
      case 'newMessage':
        this.setReceiver(element);
        break;

      case 'textarea':
        this.tagReceiver(element, this.searchService.isChannel() ? '#' : '@');
        break;

      default:
        break;
    }
  }
}
