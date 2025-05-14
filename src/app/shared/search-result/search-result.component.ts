import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { SearchService } from '../../services/search/search.service';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-search-result',
  imports: [MatIcon, CommonModule],
  templateUrl: './search-result.component.html',
  styleUrl: './search-result.component.scss',
})
export class SearchResultComponent {
  searchService: SearchService = inject(SearchService);

  @Input() input: string = '';
  @Output() inputChange = new EventEmitter<string>();

  /**
   *Tags a User or Channel to the Message.
   */
  public tagReciver(receiverData: any, tagType: any) {
    let tagName = receiverData.fullname || receiverData.data.name;
    this.input = this.input.split(tagType)[0];
    this.input += tagType + tagName + ' ';
    this.inputChange.emit(this.input);
    this.searchService.closeList();
    this.searchService.stopObserveInput();
  }
}
