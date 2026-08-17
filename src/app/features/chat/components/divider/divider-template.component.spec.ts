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

  it('renders the German weekday + date for a raw JS Date pointing at a past day', () => {
    const past = new Date('2020-01-15T10:00:00');
    fixture.componentRef.setInput('messageData', past);
    fixture.detectChanges();
    expect(dateText()).toBe('Mittwoch, 15. Januar');
  });

  it('renders correctly for a raw ISO date string pointing at a past day (string branch of toDateSafe is parsed correctly)', () => {
    fixture.componentRef.setInput('messageData', '2020-01-15T10:00:00');
    fixture.detectChanges();
    expect(dateText()).toBe('Mittwoch, 15. Januar');
  });
});
