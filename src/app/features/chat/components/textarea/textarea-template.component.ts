import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ALL_EMOJIS } from '../../../../shared/constants';
import { SearchResultComponent } from '../../../../shared/components/search-result/search-result.component';
import { SearchService } from '../../../../shared/services/search/search.service';
import { MentionService } from '../../../../shared/services/mention/mention.service';

@Component({
  selector: 'app-textarea-template',
  imports: [CommonModule, FormsModule, MatIcon, SearchResultComponent],
  templateUrl: './textarea-template.component.html',
  styleUrl: './textarea-template.component.scss',
})
export class TextareaTemplateComponent {
  public searchService: SearchService = inject(SearchService);
  private mentionService = inject(MentionService);

  public reactionMenuOpenInTextarea: boolean = false;
  public input: string = '';
  private taggedNames: string[] = [];

  public readonly emojis = ALL_EMOJIS;

  public isChannelComponent = input<boolean>(false);
  public placeholderText = input<string>('Starte eine neue Nachricht');

  public send = output<string>();

  /**
   * Splices a chosen mention tag into the input at the current search query.
   */
  onTagInserted(tagName: string) {
    this.input = this.mentionService.insertTag(this.input, tagName, this.searchService.searchQuery);
    this.taggedNames.push(tagName);
  }

  /**
   * Formats the current input and emits it to the parent, which decides
   * how and where to send it.
   */
  newMessage(): void {
    if (!this.input.trim()) return;
    const messageToSend = this.mentionService.formatMentionMarkers(this.input, this.taggedNames);
    this.send.emit(messageToSend);
    this.input = '';
    this.taggedNames = [];
  }

  /**
   * Adds an emoji to the Message - Input.
   * @param emoji - The emoji to add
   */
  public addEmoji(emoji: string) {
    this.input += emoji;
  }
}
