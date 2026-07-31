import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
}
