import { TestBed } from '@angular/core/testing';
import { MentionService } from './mention.service';
import { UserStore } from '../user/user-store';
import { ChannelService } from '../../../features/channel/services/channel/channel.service';
import { NavigationService } from '../navigation/navigation.service';
import { makeUser } from '../../../../testing/user-fixtures';
import { makeChannel } from '../../../../testing/channel-fixtures';

describe('MentionService', () => {
  let service: MentionService;
  let userStoreSpy: jasmine.SpyObj<UserStore>;
  let channelServiceSpy: jasmine.SpyObj<ChannelService>;
  let navigationServiceSpy: jasmine.SpyObj<NavigationService>;

  beforeEach(() => {
    userStoreSpy = jasmine.createSpyObj<UserStore>('UserStore', ['findUserByDisplayName']);
    channelServiceSpy = jasmine.createSpyObj<ChannelService>('ChannelService', ['findChannelByName']);
    navigationServiceSpy = jasmine.createSpyObj<NavigationService>('NavigationService', ['selectChannel', 'selectDirectMessageRecipient']);

    TestBed.configureTestingModule({
      providers: [
        { provide: UserStore, useValue: userStoreSpy },
        { provide: ChannelService, useValue: channelServiceSpy },
        { provide: NavigationService, useValue: navigationServiceSpy },
      ],
    });
    service = TestBed.inject(MentionService);
  });

  describe('insertTag()', () => {
    it('inserts the tag at the very start of the input, without duplicating the space already there', () => {
      const result = service.insertTag('@jo world', 'John', '@', 0, 3);
      expect(result.text).toBe('@John world');
      expect(result.caret).toBe(6);
    });

    it('inserts the tag mid-string, preserving text before and after byte-for-byte', () => {
      const result = service.insertTag('hi @jo there', 'Jonas', '@', 3, 6);
      expect(result.text).toBe('hi @Jonas there');
      expect(result.caret).toBe(10);
    });

    it('inserts the tag when the token reaches the end of the string', () => {
      const result = service.insertTag('hi @jo', 'Jo', '@', 3, 6);
      expect(result.text).toBe('hi @Jo ');
      expect(result.caret).toBe(7);
    });

    it('handles tokenStart === tokenEnd (empty query, nothing to replace)', () => {
      const result = service.insertTag('hi ', 'Sam', '@', 3, 3);
      expect(result.text).toBe('hi @Sam ');
      expect(result.caret).toBe(8);
    });

    it('uses the "#" symbol for channel tags', () => {
      const result = service.insertTag('check #gen now', 'general', '#', 6, 10);
      expect(result.text).toBe('check #general now');
      expect(result.caret).toBe(15);
    });

    it('preserves text strictly outside [tokenStart, tokenEnd) byte-for-byte', () => {
      const input = 'PREFIX @old SUFFIX';
      const tokenStart = input.indexOf('@old');
      const tokenEnd = tokenStart + '@old'.length;

      const result = service.insertTag(input, 'new', '@', tokenStart, tokenEnd);

      // The token here is already followed by a space, so the implementation
      // reuses it as the separator instead of adding a second one - the text
      // before tokenStart and after tokenEnd is preserved exactly, just with
      // the tag spliced in between.
      expect(result.text.startsWith(input.slice(0, tokenStart))).toBeTrue();
      expect(result.text.endsWith(input.slice(tokenEnd))).toBeTrue();
      expect(result.text).toBe('PREFIX @new SUFFIX');
    });

    it('adds its own separator space when the token is not already followed by whitespace', () => {
      const result = service.insertTag('hi @joX', 'Jo', '@', 3, 6);
      expect(result.text).toBe('hi @Jo X');
      expect(result.caret).toBe(7);
    });
  });

  describe('formatMentionMarkers()', () => {
    it('is a no-op for zero mentions', () => {
      const text = 'Hallo wie geht es dir';
      expect(service.formatMentionMarkers(text, [])).toBe(text);
    });

    it('marks a single mention', () => {
      const result = service.formatMentionMarkers("Hallo @Tom wie geht's", ['@Tom']);
      expect(result).toBe("Hallo @Tom// wie geht's");
    });

    it('marks multiple distinct mentions, each exactly once', () => {
      const result = service.formatMentionMarkers('@Tom und @Anna sind da', ['@Tom', '@Anna']);
      expect(result).toBe('@Tom// und @Anna// sind da');
    });

    it('does not double-mark a mention that already ends with the marker sequence, marking the next unmarked occurrence instead', () => {
      const result = service.formatMentionMarkers('@Tom// nochmal @Tom', ['@Tom']);
      expect(result).toBe('@Tom// nochmal @Tom//');
    });

    it('only marks the FIRST unmarked occurrence, leaving later occurrences untouched', () => {
      const result = service.formatMentionMarkers('@Tom @Tom @Tom', ['@Tom']);
      expect(result).toBe('@Tom// @Tom @Tom');
    });

    it('escapes regex-special characters in the name so they match literally', () => {
      const result = service.formatMentionMarkers('Hey @O.J.(Special)+ bist du da?', ['@O.J.(Special)+']);
      expect(result).toBe('Hey @O.J.(Special)+// bist du da?');
    });

    it('does not mistakenly match unrelated text due to unescaped regex metacharacters', () => {
      // If '.' were left as a regex wildcard this would incorrectly match "@OXJ" too.
      const result = service.formatMentionMarkers('@OXJ should stay untouched, only @O.J marked', ['@O.J']);
      expect(result).toBe('@OXJ should stay untouched, only @O.J// marked');
    });

    it('applies each name in the array independently across the same text', () => {
      const result = service.formatMentionMarkers('#general and #random both mentioned', ['#general', '#random']);
      expect(result).toBe('#general// and #random// both mentioned');
    });

    it('leaves text unchanged when the tagged name is not present in the text', () => {
      const text = 'no mentions here';
      const result = service.formatMentionMarkers(text, ['@Ghost']);
      expect(result).toBe(text);
    });
  });

  describe('resolveTagName()', () => {
    it('returns the channel name for a Channel (has a "member" array)', () => {
      const channel = makeChannel({ name: 'General' });
      expect(service.resolveTagName(channel)).toBe('General');
    });

    it('returns the displayName for a User (no "member" array)', () => {
      const user = makeUser({ displayName: 'Alice' });
      expect(service.resolveTagName(user)).toBe('Alice');
    });
  });

  describe('handleMentionClick()', () => {
    it('navigates when the click target IS the .tag-btn', () => {
      spyOn(service, 'navigateToMention');
      const btn = document.createElement('button');
      btn.className = 'tag-btn';
      btn.textContent = '@Alice';
      const event = { target: btn } as unknown as MouseEvent;

      service.handleMentionClick(event);

      expect(service.navigateToMention).toHaveBeenCalledWith('@', 'Alice');
    });

    it('navigates when the click target is a descendant of .tag-btn (closest() finds it)', () => {
      spyOn(service, 'navigateToMention');
      const btn = document.createElement('button');
      btn.className = 'tag-btn';
      btn.textContent = '#general';
      const inner = document.createElement('span');
      btn.appendChild(inner);
      const event = { target: inner } as unknown as MouseEvent;

      service.handleMentionClick(event);

      expect(service.navigateToMention).toHaveBeenCalledWith('#', 'general');
    });

    it('is a no-op when the click target has no .tag-btn ancestor', () => {
      spyOn(service, 'navigateToMention');
      const plain = document.createElement('div');
      const event = { target: plain } as unknown as MouseEvent;

      service.handleMentionClick(event);

      expect(service.navigateToMention).not.toHaveBeenCalled();
    });

    it('is a no-op for an empty textContent', () => {
      spyOn(service, 'navigateToMention');
      const btn = document.createElement('button');
      btn.className = 'tag-btn';
      btn.textContent = '';
      const event = { target: btn } as unknown as MouseEvent;

      service.handleMentionClick(event);

      expect(service.navigateToMention).not.toHaveBeenCalled();
    });

    it('is a no-op for a whitespace-only textContent', () => {
      spyOn(service, 'navigateToMention');
      const btn = document.createElement('button');
      btn.className = 'tag-btn';
      btn.textContent = '   ';
      const event = { target: btn } as unknown as MouseEvent;

      service.handleMentionClick(event);

      expect(service.navigateToMention).not.toHaveBeenCalled();
    });

    it('trims surrounding whitespace and inner padding when parsing the tag', () => {
      spyOn(service, 'navigateToMention');
      const btn = document.createElement('button');
      btn.className = 'tag-btn';
      btn.textContent = '  @  Foo Bar  ';
      const event = { target: btn } as unknown as MouseEvent;

      service.handleMentionClick(event);

      expect(service.navigateToMention).toHaveBeenCalledWith('@', 'Foo Bar');
    });
  });

  describe('navigateToMention()', () => {
    it('"@name" found: navigates to the resolved user id via selectDirectMessageRecipient', async () => {
      const user = makeUser({ id: 'u42', displayName: 'Alice' });
      userStoreSpy.findUserByDisplayName.and.resolveTo(user);

      await service.navigateToMention('@', 'Alice');

      expect(userStoreSpy.findUserByDisplayName).toHaveBeenCalledWith('Alice');
      expect(navigationServiceSpy.selectDirectMessageRecipient).toHaveBeenCalledWith('u42');
    });

    it('"@name" not found: navigates nowhere', async () => {
      userStoreSpy.findUserByDisplayName.and.resolveTo(null);

      await service.navigateToMention('@', 'Ghost');

      expect(navigationServiceSpy.selectDirectMessageRecipient).not.toHaveBeenCalled();
    });

    it('"#name" found: navigates to the channel via selectChannel', async () => {
      const channel = makeChannel({ id: 'c7', name: 'general' });
      channelServiceSpy.findChannelByName.and.resolveTo(channel);

      await service.navigateToMention('#', 'general');

      expect(channelServiceSpy.findChannelByName).toHaveBeenCalledWith('general');
      expect(navigationServiceSpy.selectChannel).toHaveBeenCalledWith('c7');
    });

    it('"#name" found but with a falsy channel.id: navigates nowhere', async () => {
      const channel = makeChannel({ name: 'general' });
      (channel as any).id = undefined;
      channelServiceSpy.findChannelByName.and.resolveTo(channel);

      await service.navigateToMention('#', 'general');

      expect(navigationServiceSpy.selectChannel).not.toHaveBeenCalled();
    });

    it('"#name" not found: navigates nowhere', async () => {
      channelServiceSpy.findChannelByName.and.resolveTo(null);

      await service.navigateToMention('#', 'ghost-channel');

      expect(navigationServiceSpy.selectChannel).not.toHaveBeenCalled();
    });

    it('an unknown symbol looks up nothing and navigates nowhere', async () => {
      await service.navigateToMention('$', 'whatever');

      expect(userStoreSpy.findUserByDisplayName).not.toHaveBeenCalled();
      expect(channelServiceSpy.findChannelByName).not.toHaveBeenCalled();
      expect(navigationServiceSpy.selectDirectMessageRecipient).not.toHaveBeenCalled();
      expect(navigationServiceSpy.selectChannel).not.toHaveBeenCalled();
    });
  });
});
