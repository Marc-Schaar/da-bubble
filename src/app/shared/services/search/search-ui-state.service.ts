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
  private isResultTrue = false;
  private directTag = false;
  private currentList: (User | Channel)[] = [];
  private searchInComponent: 'header' | 'textarea' | 'newMessage' | null = null;
  public searchQuery = '';

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
    return this.currentList;
  }

  public setCurrentList(list: (User | Channel)[]): void {
    this.currentList = list;
  }

  public isDirectTag(): boolean {
    return this.directTag;
  }

  public setIsDirectTag(isDirect: boolean): void {
    this.directTag = isDirect;
  }

  /**
   * True, sobald ein Ergebnis final ausgewählt wurde und weitere
   * Input-Events keine neue Suche mehr auslösen sollen.
   */
  public isResultStopped(): boolean {
    return this.isResultTrue;
  }

  public setResult(stopped: boolean): void {
    this.isResultTrue = stopped;
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
    this.currentList = [];
    this.isChannel.set(false);
    this.textareaListOpen = false;
    this.headerListOpen = false;
    this.newMessageListOpen = false;
    this.directTag = false;
  }
}
