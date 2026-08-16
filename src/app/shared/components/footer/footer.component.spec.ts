import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders a footer element with two links', () => {
    const footer = fixture.nativeElement.querySelector('footer.footer');
    expect(footer).toBeTruthy();
    const links = footer.querySelectorAll('a');
    expect(links.length).toBe(2);
  });

  it('links to /imprint labeled "Impressum"', () => {
    const links: HTMLAnchorElement[] = Array.from(fixture.nativeElement.querySelectorAll('a'));
    const imprintLink = links.find((a) => a.textContent?.trim() === 'Impressum');
    expect(imprintLink).toBeTruthy();
    expect(imprintLink?.getAttribute('href')).toBe('/imprint');
  });

  it('links to /Dataprotection labeled "Datenschutz"', () => {
    // Note: capital "D" in "/Dataprotection" is preserved as-is from the source template.
    const links: HTMLAnchorElement[] = Array.from(fixture.nativeElement.querySelectorAll('a'));
    const dataProtectionLink = links.find((a) => a.textContent?.trim() === 'Datenschutz');
    expect(dataProtectionLink).toBeTruthy();
    expect(dataProtectionLink?.getAttribute('href')).toBe('/Dataprotection');
  });
});
