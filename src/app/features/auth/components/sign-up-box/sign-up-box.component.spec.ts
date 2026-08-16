import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SignUpBoxComponent } from './sign-up-box.component';

describe('SignUpBoxComponent', () => {
  let component: SignUpBoxComponent;
  let fixture: ComponentFixture<SignUpBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignUpBoxComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SignUpBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the "Neu bei DABubble?" prompt text', () => {
    const p: HTMLParagraphElement = fixture.nativeElement.querySelector('p');
    expect(p?.textContent?.trim()).toBe('Neu bei DABubble?');
  });

  it('renders a "Konto erstellen" link that routes to /register', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link).toBeTruthy();
    expect(link.textContent?.trim()).toBe('Konto erstellen');
    expect(link.getAttribute('href')).toBe('/register');
  });

  it('renders exactly one paragraph and one link, and nothing else of substance', () => {
    expect(fixture.nativeElement.querySelectorAll('p').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('a').length).toBe(1);
  });
});
