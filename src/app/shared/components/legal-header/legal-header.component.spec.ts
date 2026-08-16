import { Location } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LegalHeaderComponent } from './legal-header.component';

describe('LegalHeaderComponent', () => {
  let component: LegalHeaderComponent;
  let fixture: ComponentFixture<LegalHeaderComponent>;
  let locationSpy: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    locationSpy = jasmine.createSpyObj<Location>('Location', ['back']);

    await TestBed.configureTestingModule({
      imports: [LegalHeaderComponent],
      providers: [{ provide: Location, useValue: locationSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(LegalHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('heading', 'Impressum');
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('renders the heading text in an <h1>', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1?.textContent.trim()).toBe('Impressum');
  });

  it('updates the rendered heading when the input changes', () => {
    fixture.componentRef.setInput('heading', 'Datenschutzerklärung');
    fixture.detectChanges();
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1?.textContent.trim()).toBe('Datenschutzerklärung');
  });

  it('does not expose a "title" input (renamed to "heading" to avoid colliding with the native title/tooltip attribute)', () => {
    expect('title' in component).toBe(false);
    // The native title/tooltip attribute must not be set on the host either.
    expect(fixture.nativeElement.hasAttribute('title')).toBe(false);
  });

  it('renders a back button with an arrow_back icon and "Zurück" aria-label', () => {
    const btn = fixture.nativeElement.querySelector('app-button button');
    expect(btn.getAttribute('aria-label')).toBe('Zurück');
    expect(btn.type).toBe('button');
    const icon = fixture.nativeElement.querySelector('mat-icon');
    expect(icon?.textContent.trim()).toBe('arrow_back');
  });

  it('calls Location.back() when the back button is clicked', () => {
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('app-button button');
    btn.click();
    expect(locationSpy.back).toHaveBeenCalledTimes(1);
  });

  it('goBack() delegates directly to Location.back()', () => {
    component.goBack();
    expect(locationSpy.back).toHaveBeenCalledTimes(1);
  });
});
