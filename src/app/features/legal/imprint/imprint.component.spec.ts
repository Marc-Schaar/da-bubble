import { Location } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ImprintComponent } from './imprint.component';
import { AuthService } from '../../auth/services/auth/auth.service';
import { CONTACT_EMAIL } from '../../../shared/constants';

describe('ImprintComponent', () => {
  let component: ImprintComponent;
  let fixture: ComponentFixture<ImprintComponent>;
  let locationSpy: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    locationSpy = jasmine.createSpyObj<Location>('Location', ['back']);

    await TestBed.configureTestingModule({
      imports: [ImprintComponent],
      providers: [
        provideRouter([]),
        { provide: Location, useValue: locationSpy },
        { provide: AuthService, useValue: { currentUser: () => null, isGuest: () => false } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImprintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the CONTACT_EMAIL constant', () => {
    expect((component as any).contactEmail).toBe(CONTACT_EMAIL);
  });

  it('renders the legal-header with heading "Impressum"', () => {
    const h1 = fixture.nativeElement.querySelector('app-legal-header h1');
    expect(h1?.textContent.trim()).toBe('Impressum');
  });

  it('renders a mailto link with the contact email', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('address a');
    expect(link.getAttribute('href')).toBe(`mailto:${CONTACT_EMAIL}`);
    expect(link.textContent?.trim()).toBe(CONTACT_EMAIL);
  });

  it(
    'clicking the back button (rendered inside the nested app-legal-header) calls Location.back() — ' +
      'ImprintComponent itself has no back-navigation logic of its own; it delegates entirely to ' +
      'LegalHeaderComponent, which injects Location directly (not NavigationService/Router)',
    () => {
      const backBtn: HTMLButtonElement = fixture.nativeElement.querySelector('app-legal-header app-button button');
      expect(backBtn).toBeTruthy();
      backBtn.click();
      expect(locationSpy.back).toHaveBeenCalledTimes(1);
    },
  );
});
