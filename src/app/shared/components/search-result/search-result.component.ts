import { ChangeDetectionStrategy, Component, EventEmitter, inject, input, Input, Output } from '@angular/core';
import { SearchService } from '../../services/search/search.service';
import { MentionService } from '../../services/mention/mention.service';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResultComponent {
  public readonly searchService: SearchService = inject(SearchService);
  private readonly navigationService: NavigationService = inject(NavigationService);
  private readonly mentionService: MentionService = inject(MentionService);

  @Input() input: string = '';
  @Output() inputChange = new EventEmitter<string>();
  @Output() tagInserted = new EventEmitter<string>();
  @Output() currentReceiver = new EventEmitter<any>();

  /** Id of the rendered `role="listbox"` — callers pass a fixed, per-usage-unique string so their paired input can reference it via aria-controls/aria-activedescendant. */
  public readonly listboxId = input<string>('search-result-listbox');

  /**
   * Tags a receiver (user or channel) by emitting its display name; the
   * caller (TextareaTemplateComponent) knows the active `@`/`#` symbol and
   * token position and performs the actual insertion.
   *
   * @param receiverData - The data object of the receiver (user or channel).
   */
  public tagReceiver(receiverData: Channel | User) {
    this.tagInserted.emit(this.mentionService.resolveTagName(receiverData));
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
        this.tagReceiver(element);
        break;

      default:
        break;
    }
  }

  /** Dispatches the currently keyboard-highlighted item exactly as a click on it would — for Enter-to-select in the paired input's keydown handling. */
  public selectHighlighted(): void {
    const element = this.searchService.getHighlightedElement();
    if (element) this.handleClick(element);
  }
}
