import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ALL_EMOJIS } from '../../../../shared/constants';
import { SearchResultComponent } from '../../../../shared/components/search-result/search-result.component';
import { SearchService } from '../../../../shared/services/search/search.service';
import { MentionService } from '../../../../shared/services/mention/mention.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-textarea-template',
  imports: [CommonModule, FormsModule, MatIcon, SearchResultComponent, ButtonComponent],
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

  private readonly dropdownNavKeys = new Set(['ArrowUp', 'ArrowDown', 'Enter', 'Escape']);

  /**
   * Re-runs mention detection for the current caret position. Bound to both
   * text-changing (input) and caret-only (click/keyup) events, so moving the
   * caret in or out of a `@`/`#` token opens/closes the dropdown on its own.
   */
  onCaretMoved(ta: HTMLTextAreaElement) {
    this.searchService.observeInput(this.input, 'textarea', ta.selectionStart ?? this.input.length);
  }

  /**
   * Wraps `onCaretMoved` for the (keyup) binding: while the dropdown is open,
   * Up/Down/Enter/Escape are consumed by `onKeydown` for list navigation and
   * must not also trigger a re-search here — that would reset the
   * keyboard-highlighted suggestion back to index 0 on every keystroke.
   */
  onKeyup(event: KeyboardEvent, ta: HTMLTextAreaElement) {
    if (this.searchService.getListBoolean() && this.dropdownNavKeys.has(event.key)) return;
    this.onCaretMoved(ta);
  }

  /**
   * Splices a chosen mention tag into the input at the currently tracked
   * `@`/`#` token, then refocuses the textarea right after the inserted tag
   * so the user can keep typing (including starting another mention).
   */
  onTagInserted(tagName: string, ta: HTMLTextAreaElement) {
    const range = this.searchService.getActiveTokenRange();
    if (!range) return;
    const symbol = this.searchService.isChannel() ? '#' : '@';
    const { text, caret } = this.mentionService.insertTag(this.input, tagName, symbol, range.start, range.end);
    this.input = text;
    this.taggedNames.push(`${symbol}${tagName}`);
    this.searchService.resetList();

    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(caret, caret);
    });
  }

  /**
   * Handles Enter/Arrow/Escape while the suggestion dropdown is open so it
   * doesn't conflict with sending the message or moving the caret.
   */
  onKeydown(event: KeyboardEvent, ta: HTMLTextAreaElement) {
    if (!this.searchService.getListBoolean()) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        this.newMessage();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.searchService.moveHighlightedIndex(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.searchService.moveHighlightedIndex(-1);
        break;
      case 'Enter': {
        event.preventDefault();
        const element = this.searchService.getHighlightedElement();
        if (element) this.onTagInserted(this.mentionService.resolveTagName(element), ta);
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.searchService.resetList();
        break;
    }
  }

  /**
   * Inserts the `@`/`#` trigger at the caret position (icon buttons), then
   * runs it through the normal detection so the dropdown opens consistently
   * with typing the character directly.
   */
  insertTrigger(symbol: '@' | '#', ta: HTMLTextAreaElement) {
    const pos = ta.selectionStart ?? this.input.length;
    this.input = this.input.slice(0, pos) + symbol + this.input.slice(pos);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(pos + 1, pos + 1);
      this.onCaretMoved(ta);
    });
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
