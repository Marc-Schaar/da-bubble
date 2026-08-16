import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchResultComponent } from './search-result.component';
import { SearchService } from '../../services/search/search.service';
import { MentionService } from '../../services/mention/mention.service';
import { NavigationService } from '../../services/navigation/navigation.service';
import { Channel } from '../../../features/channel/models/channel/channel';
import { User } from '../../../features/auth/models/user/user';
import { makeChannel } from '../../../../testing/channel-fixtures';
import { makeUser } from '../../../../testing/user-fixtures';
import { mockSignal } from '../../../../testing/signal-service-mock.util';

describe('SearchResultComponent', () => {
  let component: SearchResultComponent;
  let fixture: ComponentFixture<SearchResultComponent>;
  let searchServiceSpy: jasmine.SpyObj<SearchService>;
  let mentionServiceSpy: jasmine.SpyObj<MentionService>;
  let navigationServiceSpy: jasmine.SpyObj<NavigationService>;

  let currentList: (User | Channel)[] = [];

  beforeEach(async () => {
    currentList = [];

    searchServiceSpy = jasmine.createSpyObj<SearchService>('SearchService', [
      'getSearchComponent',
      'getCurrentList',
      'getHighlightedIndex',
      'resetList',
      'getHighlightedElement',
    ]) as any;
    (searchServiceSpy as any).isChannel = mockSignal<boolean | null>(null);
    searchServiceSpy.getCurrentList.and.callFake(() => currentList);
    searchServiceSpy.getHighlightedIndex.and.returnValue(-1);

    mentionServiceSpy = jasmine.createSpyObj<MentionService>('MentionService', ['resolveTagName']);
    navigationServiceSpy = jasmine.createSpyObj<NavigationService>('NavigationService', [
      'selectDirectMessageRecipient',
      'selectChannel',
    ]);

    await TestBed.configureTestingModule({
      imports: [SearchResultComponent],
      providers: [
        { provide: SearchService, useValue: searchServiceSpy },
        { provide: MentionService, useValue: mentionServiceSpy },
        { provide: NavigationService, useValue: navigationServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchResultComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders the empty state with "Eintrag" when isChannel is null and the list is empty', () => {
    searchServiceSpy.isChannel.set(null);
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('.empty-state');
    expect(empty).toBeTruthy();
    expect(empty.textContent).toContain('Eintrag');
  });

  it('renders the empty state with "Channel" when isChannel is true and the list is empty', () => {
    searchServiceSpy.isChannel.set(true);
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('.empty-state');
    expect(empty.textContent).toContain('Channel');
  });

  it('renders the empty state with "Nutzer" when isChannel is false and the list is empty', () => {
    searchServiceSpy.isChannel.set(false);
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('.empty-state');
    expect(empty.textContent).toContain('Nutzer');
  });

  it('renders channel results with a tag icon and the channel name', () => {
    const channel = makeChannel({ name: 'Entwicklung' });
    currentList = [channel];
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('li[role="option"]');
    expect(options.length).toBe(1);
    expect(options[0].querySelector('mat-icon')?.textContent?.trim()).toBe('tag');
    expect(options[0].textContent).toContain('Entwicklung');
  });

  it('renders user results via app-user-list-item', () => {
    const user = makeUser({ displayName: 'Erika Musterfrau' });
    currentList = [user];
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('li[role="option"]');
    expect(options.length).toBe(1);
    expect(options[0].querySelector('app-user-list-item')).toBeTruthy();
    expect(options[0].textContent).toContain('Erika Musterfrau');
  });

  it('marks the highlighted result via aria-selected and the highlighted class', () => {
    currentList = [makeUser(), makeUser()];
    searchServiceSpy.getHighlightedIndex.and.returnValue(1);
    fixture.detectChanges();

    const options: NodeListOf<HTMLLIElement> = fixture.nativeElement.querySelectorAll('li[role="option"]');
    expect(options[0].getAttribute('aria-selected')).toBe('false');
    expect(options[0].classList.contains('highlighted')).toBeFalse();
    expect(options[1].getAttribute('aria-selected')).toBe('true');
    expect(options[1].classList.contains('highlighted')).toBeTrue();
  });

  describe('handleClick / result-btn click dispatch by search context', () => {
    it('in "header" context, clicking a channel opens it and resets the list', () => {
      const channel = makeChannel();
      currentList = [channel];
      searchServiceSpy.getSearchComponent.and.returnValue('header');
      fixture.detectChanges();

      fixture.nativeElement.querySelector('.result-btn').click();

      expect(searchServiceSpy.isChannel()).toBe(true);
      expect(navigationServiceSpy.selectChannel).toHaveBeenCalledOnceWith(channel.id!);
      expect(searchServiceSpy.resetList).toHaveBeenCalled();
    });

    it('in "header" context, clicking a user opens a direct chat and resets the list', () => {
      const user = makeUser();
      currentList = [user];
      searchServiceSpy.getSearchComponent.and.returnValue('header');
      fixture.detectChanges();

      fixture.nativeElement.querySelector('.result-btn').click();

      expect(searchServiceSpy.isChannel()).toBe(false);
      expect(navigationServiceSpy.selectDirectMessageRecipient).toHaveBeenCalledOnceWith(user.id);
      expect(searchServiceSpy.resetList).toHaveBeenCalled();
    });

    it('in "newMessage" context, clicking a result emits currentReceiver and resets the list', () => {
      const user = makeUser();
      currentList = [user];
      searchServiceSpy.getSearchComponent.and.returnValue('newMessage');
      fixture.detectChanges();

      const emitted: unknown[] = [];
      component.currentReceiver.subscribe((v) => emitted.push(v));

      fixture.nativeElement.querySelector('.result-btn').click();

      expect(emitted).toEqual([user]);
      expect(searchServiceSpy.resetList).toHaveBeenCalled();
    });

    it('in "textarea" context, clicking a result emits tagInserted with the resolved tag name', () => {
      const user = makeUser({ displayName: 'Max Mustermann' });
      currentList = [user];
      searchServiceSpy.getSearchComponent.and.returnValue('textarea');
      mentionServiceSpy.resolveTagName.and.returnValue('Max Mustermann');
      fixture.detectChanges();

      const emitted: string[] = [];
      component.tagInserted.subscribe((v) => emitted.push(v));

      fixture.nativeElement.querySelector('.result-btn').click();

      expect(mentionServiceSpy.resolveTagName).toHaveBeenCalledOnceWith(user);
      expect(emitted).toEqual(['Max Mustermann']);
    });

    it('in an unhandled context, clicking a result does nothing', () => {
      const user = makeUser();
      currentList = [user];
      searchServiceSpy.getSearchComponent.and.returnValue(null);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('.result-btn').click();

      expect(navigationServiceSpy.selectDirectMessageRecipient).not.toHaveBeenCalled();
      expect(navigationServiceSpy.selectChannel).not.toHaveBeenCalled();
      expect(searchServiceSpy.resetList).not.toHaveBeenCalled();
      expect(mentionServiceSpy.resolveTagName).not.toHaveBeenCalled();
    });
  });

  describe('selectHighlighted', () => {
    it('dispatches a click on the currently keyboard-highlighted element', () => {
      const channel = makeChannel();
      searchServiceSpy.getHighlightedElement.and.returnValue(channel);
      searchServiceSpy.getSearchComponent.and.returnValue('header');
      fixture.detectChanges();

      component.selectHighlighted();

      expect(navigationServiceSpy.selectChannel).toHaveBeenCalledOnceWith(channel.id!);
    });

    it('does nothing when there is no highlighted element', () => {
      searchServiceSpy.getHighlightedElement.and.returnValue(undefined as unknown as Channel | User);
      fixture.detectChanges();

      component.selectHighlighted();

      expect(navigationServiceSpy.selectChannel).not.toHaveBeenCalled();
      expect(navigationServiceSpy.selectDirectMessageRecipient).not.toHaveBeenCalled();
    });
  });

  it('renders the listbox id from the listboxId input, defaulting to "search-result-listbox"', () => {
    fixture.detectChanges();
    const ul = fixture.nativeElement.querySelector('ul');
    expect(ul.getAttribute('id')).toBe('search-result-listbox');
  });

  it('uses a custom listboxId when provided', () => {
    fixture.componentRef.setInput('listboxId', 'custom-listbox');
    fixture.detectChanges();
    const ul = fixture.nativeElement.querySelector('ul');
    expect(ul.getAttribute('id')).toBe('custom-listbox');
  });
});
