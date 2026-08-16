import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardHeaderComponent } from './card-header.component';

@Component({
  standalone: true,
  imports: [CardHeaderComponent],
  template: `<app-card-header><span class="title">My Title</span></app-card-header>`,
})
class HostComponent {}

describe('CardHeaderComponent', () => {
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

  it('wraps content in a div.card-header', () => {
    const el = fixture.nativeElement.querySelector('div.card-header');
    expect(el).toBeTruthy();
  });

  it('projects content unchanged', () => {
    const el = fixture.nativeElement.querySelector('div.card-header .title');
    expect(el?.textContent.trim()).toBe('My Title');
  });
});
