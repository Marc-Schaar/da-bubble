import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmojiQuickPickerComponent } from './emoji-quick-picker.component';

describe('EmojiQuickPickerComponent', () => {
  let fixture: ComponentFixture<EmojiQuickPickerComponent>;
  let component: EmojiQuickPickerComponent;

  const emojis = ['\u{1F44D}', '\u{2705}', '\u{1F680}'];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmojiQuickPickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmojiQuickPickerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('emojis', emojis);
    fixture.componentRef.setInput('isSelected', () => false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders one button per emoji in the input list', () => {
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('app-button button');
    expect(buttons.length).toBe(emojis.length);
    emojis.forEach((emoji, i) => expect(buttons[i].textContent?.trim()).toBe(emoji));
  });

  it('renders an aria-label per emoji reaction button', () => {
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('app-button button');
    expect(buttons[0].getAttribute('aria-label')).toBe(`Reaktion ${emojis[0]}`);
  });

  it('clicking an emoji emits pick with that exact emoji', () => {
    const picked: string[] = [];
    component.pick.subscribe((e) => picked.push(e));

    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('app-button button');
    buttons[1].click();

    expect(picked).toEqual([emojis[1]]);
  });

  it('applies the selected highlight class/aria-pressed only to emojis the isSelected predicate matches', () => {
    fixture.componentRef.setInput('isSelected', (emoji: string) => emoji === emojis[2]);
    fixture.detectChanges();

    // ngClass is bound on the <app-button> host element itself; aria-pressed is
    // an @Input that ButtonComponent forwards onto its inner native <button>.
    const hosts: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('app-button');
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('app-button button');
    expect(hosts[0].classList.contains('bg-purple')).toBeFalse();
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
    expect(hosts[2].classList.contains('bg-purple')).toBeTrue();
    expect(buttons[2].getAttribute('aria-pressed')).toBe('true');
  });

  it('renders nothing when the emoji list is empty', () => {
    fixture.componentRef.setInput('emojis', []);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('app-button button');
    expect(buttons.length).toBe(0);
  });
});
