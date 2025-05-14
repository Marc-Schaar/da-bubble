import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectmessagesComponent } from './direct-messages.component';

describe('DirectMessagesComponent', () => {
  let component: DirectmessagesComponent;
  let fixture: ComponentFixture<DirectmessagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectmessagesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DirectmessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
