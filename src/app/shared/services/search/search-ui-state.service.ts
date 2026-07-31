import { Injectable, signal } from '@angular/core';
import { Channel } from '../../../features/channel/models/channel/channel';
import { User } from '../../../features/auth/models/user/user';

/**
 * Hält den reinen UI-Zustand der Suche (welche Vorschlagsliste in welcher
 * Komponente offen ist, aktuelle Ergebnisliste, Tag-Kontext). Enthält keine
 * Suchlogik — die liegt in `SearchQueryService`.
 */
@Injectable({
  providedIn: 'root',
})
export class SearchUiStateService {
  private textareaListOpen = false;
  private headerListOpen = false;
  private newMessageListOpen = false;
  public isChannel = signal<boolean | null>(false);
  private currentList = signal<(User | Channel)[]>([]);
  private searchInComponent: 'header' | 'textarea' | 'newMessage' | null = null;
  public searchQuery = '';

  /**
   * Start-/End-Index des aktuell aktiven `@`/`#`-Tokens im Textarea-Text
   * (nur relevant, wenn `searchInComponent === 'textarea'`).
   */
  public activeTokenStart: number | null = null;
  public activeTokenEnd: number | null = null;

  /** Index des per Tastatur markierten Vorschlags im Dropdown. */
  private highlightedIndex = signal(0);

  public getSearchComponent(): 'header' | 'textarea' | 'newMessage' | null {
    return this.searchInComponent;
  }

  public setSearchComponent(component: 'header' | 'textarea' | 'newMessage'): void {
    this.searchInComponent = component;
  }

  public getListBoolean(): boolean {
    return this.textareaListOpen;
  }

  public setTextareaListOpen(open: boolean): void {
    this.textareaListOpen = open;
  }

  public getHeaderListBoolean(): boolean {
    return this.headerListOpen;
  }

  public setHeaderListOpen(open: boolean): void {
    this.headerListOpen = open;
  }

  public getNewListBoolean(): boolean {
    return this.newMessageListOpen;
  }

  public setNewMessageListOpen(open: boolean): void {
    this.newMessageListOpen = open;
  }

  public getCurrentList(): (User | Channel)[] {
    return this.currentList();
  }

  public setCurrentList(list: (User | Channel)[]): void {
    this.currentList.set(list);
    this.highlightedIndex.set(0);
  }

  public getHighlightedIndex(): number {
    return this.highlightedIndex();
  }

  /**
   * Bewegt die Tastatur-Markierung im Dropdown um `delta`, geclamped auf die
   * aktuelle Ergebnisliste.
   */
  public moveHighlightedIndex(delta: number): void {
    const list = this.currentList();
    if (list.length === 0) return;
    const next = this.highlightedIndex() + delta;
    this.highlightedIndex.set(Math.min(Math.max(next, 0), list.length - 1));
  }

  public setActiveTokenRange(start: number, end: number): void {
    this.activeTokenStart = start;
    this.activeTokenEnd = end;
  }

  public clearActiveTokenRange(): void {
    this.activeTokenStart = null;
    this.activeTokenEnd = null;
  }

  /**
   * Schließt die aktuell aktive Vorschlagsliste.
   */
  public closeList(): void {
    this.getSearchComponent() === 'header' ? this.setHeaderListOpen(false) : this.setTextareaListOpen(false);
  }

  /**
   * Setzt Ergebnisliste und alle Sichtbarkeits-Flags zurück.
   */
  public resetList(): void {
    this.currentList.set([]);
    this.isChannel.set(false);
    this.textareaListOpen = false;
    this.headerListOpen = false;
    this.newMessageListOpen = false;
    this.highlightedIndex.set(0);
    this.clearActiveTokenRange();
  }
}
