import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DividerTemplateComponent } from './divider-template.component';

describe('DividerTemplateComponent', () => {
  let component: DividerTemplateComponent;
  let fixture: ComponentFixture<DividerTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DividerTemplateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DividerTemplateComponent);
    component = fixture.componentInstance;
  });

  function dateText(): string {
    return fixture.nativeElement.querySelector('.date-container .date').textContent.trim();
  }

  it('creates', () => {
    fixture.componentRef.setInput('messageData', { toDate: () => new Date() });
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders "Heute" for a Firestore-Timestamp-like value pointing at today', () => {
    fixture.componentRef.setInput('messageData', { toDate: () => new Date() });
    fixture.detectChanges();
    expect(dateText()).toBe('Heute');
  });

  it('renders the German weekday + date for a Firestore-Timestamp-like value pointing at a past day', () => {
    // A Wednesday far in the past, guaranteed not to be "today".
    const past = new Date('2020-01-15T10:00:00');
    fixture.componentRef.setInput('messageData', { toDate: () => past });
    fixture.detectChanges();
    expect(dateText()).toBe('Mittwoch, 15. Januar');
  });

  it('renders an empty string for a null/falsy messageData', () => {
    fixture.componentRef.setInput('messageData', null);
    fixture.detectChanges();
    expect(dateText()).toBe('');
  });

  it(
    'KNOWN QUIRK: a raw JS Date (rather than a Firestore-Timestamp-like object with toDate()) always renders as ' +
      '"Heute", even for a date far in the past — because RelativeDatePipe delegates to toDateSafe(), which only ' +
      'recognizes objects with a toDate() method or a "seconds" field; a plain Date has neither and falls through ' +
      'to the "pending serverTimestamp() sentinel" branch, which returns `new Date()` (now). This is the same ' +
      'quirk documented in timestamp.util.spec.ts, surfaced here through the divider template.',
    () => {
      const past = new Date('2020-01-15T10:00:00');
      fixture.componentRef.setInput('messageData', past);
      fixture.detectChanges();
      expect(dateText()).toBe('Heute');
    },
  );

  it('renders correctly for a raw ISO date string pointing at a past day (string branch of toDateSafe is parsed correctly)', () => {
    fixture.componentRef.setInput('messageData', '2020-01-15T10:00:00');
    fixture.detectChanges();
    expect(dateText()).toBe('Mittwoch, 15. Januar');
  });
});
