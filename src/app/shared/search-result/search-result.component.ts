import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { SearchService } from '../../services/search/search.service';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../services/navigation/navigation.service';
import { A11yModule } from '@angular/cdk/a11y';
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
  @Output() inputChange = new EventEmitter<string>();

  /**
   *Tags a User or Channel to the Message.
   */
  public tagReceiver(receiverData: any, tagType: any) {
    let tagName = receiverData.fullname || receiverData.data.name;
    this.input = this.input.split(tagType)[0];
    this.input += tagType + tagName + ' ';
    this.inputChange.emit(this.input);
    this.searchService.closeList();
    this.searchService.stopObserveInput();
  }

  public openReceiver(element: any) {
    console.log(element);

    this.searchService.getChannelBoolean() ? this.openChannel(element) : this.openUser(element);
  }

  private openUser(element: any) {
    console.log(element);

    let currentUserId = this.auth.currentUser?.uid;
    this.navigationService.setUrl('direct', element.id, currentUserId);
    this.navigationService.showDirect();
  }
  private openChannel(element: any) {
    let currentUserId = this.auth.currentUser?.uid;
    this.navigationService.setUrl('channel', element.key, currentUserId);
    this.navigationService.showChannel();
  }

  public handleClick(element: any) {
    this.searchService.getHeaderListBoolean()
      ? this.openReceiver(element)
      : this.tagReceiver(element, this.searchService.getChannelBoolean() === true ? '#' : '@');
  }
}
