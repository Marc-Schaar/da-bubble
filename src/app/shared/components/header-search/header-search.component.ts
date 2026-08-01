import { ChangeDetectionStrategy, Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { SearchService } from '../../services/search/search.service';
import { SearchResultComponent } from '../search-result/search-result.component';
import { InputComponent } from '../input/input.component';

@Component({
  selector: 'app-header-search',
  imports: [FormsModule, MatIconModule, SearchResultComponent, InputComponent],
  templateUrl: './header-search.component.html',
  styleUrl: './header-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderSearchComponent {
  public searchService: SearchService = inject(SearchService);
  public input: string = '';

  @ViewChild(SearchResultComponent) private searchResultRef?: SearchResultComponent;

  protected readonly listboxId = 'header-search-listbox';

  /** Arrow/Enter/Escape navigation for the suggestion dropdown; only active while it's actually open. */
  protected onSearchKeydown(event: KeyboardEvent): void {
    if (!this.searchService.getHeaderListBoolean()) return;
    this.searchService.handleDropdownKeydown(event, () => this.searchResultRef?.selectHighlighted());
  }

  protected activeDescendantId(): string | null {
    const index = this.searchService.getHighlightedIndex();
    return this.searchService.getHeaderListBoolean() && index >= 0 ? `${this.listboxId}-option-${index}` : null;
  }
}
