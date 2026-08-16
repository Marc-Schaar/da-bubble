import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardComponent } from './card.component';

@Component({
  standalone: true,
  imports: [CardComponent],
  template: `<app-card>
    <div card-header>Header content</div>
    <div card-main>Main content</div>
    <div card-footer>Footer content</div>
  </app-card>`,
})
class HostComponent {}

describe('CardComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('wraps content in a .card div', () => {
    expect(fixture.nativeElement.querySelector('div.card')).toBeTruthy();
  });

  it('projects [card-header] content', () => {
    const el = fixture.nativeElement.querySelector('[card-header]');
    expect(el?.textContent.trim()).toBe('Header content');
  });

  it('projects [card-main] content', () => {
    const el = fixture.nativeElement.querySelector('[card-main]');
    expect(el?.textContent.trim()).toBe('Main content');
  });

  it('projects [card-footer] content', () => {
    const el = fixture.nativeElement.querySelector('[card-footer]');
    expect(el?.textContent.trim()).toBe('Footer content');
  });

  it('renders all three slots inside the .card wrapper', () => {
    const card = fixture.nativeElement.querySelector('div.card');
    expect(card.querySelector('[card-header]')).toBeTruthy();
    expect(card.querySelector('[card-main]')).toBeTruthy();
    expect(card.querySelector('[card-footer]')).toBeTruthy();
  });
});
