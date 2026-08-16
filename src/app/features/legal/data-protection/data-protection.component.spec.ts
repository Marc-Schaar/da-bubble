import { Location } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DataprotectionComponent } from './data-protection.component';
import { AuthService } from '../../auth/services/auth/auth.service';
import { CONTACT_EMAIL } from '../../../shared/constants';

describe('DataprotectionComponent', () => {
  let component: DataprotectionComponent;
  let fixture: ComponentFixture<DataprotectionComponent>;
  let locationSpy: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    locationSpy = jasmine.createSpyObj<Location>('Location', ['back']);

    await TestBed.configureTestingModule({
      imports: [DataprotectionComponent],
      providers: [
        provideRouter([]),
        { provide: Location, useValue: locationSpy },
        { provide: AuthService, useValue: { currentUser: () => null, isGuest: () => false } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DataprotectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the CONTACT_EMAIL constant', () => {
    expect((component as any).contactEmail).toBe(CONTACT_EMAIL);
  });

  it('renders the legal-header with heading "Datenschutzerklärung"', () => {
    const h1 = fixture.nativeElement.querySelector('app-legal-header h1');
    expect(h1?.textContent.trim()).toBe('Datenschutzerklärung');
  });

  it(
    'clicking the back button (rendered inside the nested app-legal-header) calls Location.back() — ' +
      'DataprotectionComponent itself has no back-navigation logic of its own; it delegates entirely to ' +
      'LegalHeaderComponent, which injects Location directly (not NavigationService/Router)',
    () => {
      const backBtn: HTMLButtonElement = fixture.nativeElement.querySelector('app-legal-header app-button button');
      expect(backBtn).toBeTruthy();
      backBtn.click();
      expect(locationSpy.back).toHaveBeenCalledTimes(1);
    },
  );

  it('renders the main policy content', () => {
    const main = fixture.nativeElement.querySelector('main');
    expect(main?.textContent).toContain('Datenschutz');
  });
});
