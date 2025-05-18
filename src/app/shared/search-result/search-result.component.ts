import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { SearchService } from '../../services/search/search.service';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../services/navigation/navigation.service';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-search-result',
  imports: [MatIcon, CommonModule],
  templateUrl: './search-result.component.html',
  styleUrl: './search-result.component.scss',
})
export class SearchResultComponent {
  searchService: SearchService = inject(SearchService);
  navigationService: NavigationService = inject(NavigationService);
  auth: Auth = inject(Auth);
  @Input() input: string = '';
  @Output() tagInserted = new EventEmitter<string>();

  /**
   * Tags a receiver (user or channel) in the input field by inserting their name with the tagType.
   * Emits the updated input, then closes and stops observing the search list.
   *
   * @param receiverData - The data object of the receiver (user or channel).
   * @param tagType - The tag symbol to use (e.g., '@' for user, '#' for channel).
   */
  public tagReceiver(receiverData: any, tagType: '@' | '#') {
    const tagName = receiverData.fullname || receiverData.data.name;
    this.tagInserted.emit(tagName);

    this.searchService.closeList();
    this.searchService.stopObserveInput();
  }

  /**
   * Opens the receiver view depending on whether it's a channel or a user.
   *
   * @param element - The selected receiver element (channel or user).
   */
  public openReceiver(element: any) {
    this.searchService.getChannelBoolean() ? this.openChannel(element) : this.openUser(element);
  }

  /**
   * Opens a direct user chat view and resets the search list.
   *
   * @param element - The user element to open.
   */
  private openUser(element: any) {
    let currentUserId = this.auth.currentUser?.uid;
    this.navigationService.showDirect();
    this.navigationService.setUrl('direct', element.id, currentUserId);
    this.searchService.resetList();
  }

  /**
   * Opens a channel view and resets the search list.
   *
   * @param element - The channel element to open.
   */
  private openChannel(element: any) {
    let currentUserId = this.auth.currentUser?.uid;
    this.navigationService.showChannel();
    this.navigationService.setUrl('channel', element.key, currentUserId);
    this.searchService.resetList();
  }

  /**
   * Handles the click event on an element.
   * If the header list is open, opens the receiver view;
   * otherwise tags the receiver in the input field.
   *
   * @param element - The clicked element (user or channel).
   */
  public handleClick(element: any) {
    this.searchService.getHeaderListBoolean()
      ? this.openReceiver(element)
      : this.tagReceiver(element, this.searchService.getChannelBoolean() === true ? '#' : '@');
  }
}
