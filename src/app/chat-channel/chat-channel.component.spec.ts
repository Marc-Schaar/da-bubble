import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatContentComponent } from './chat-channel.component';

describe('ChatContentComponent', () => {
  let component: ChatContentComponent;
  let fixture: ComponentFixture<ChatContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatContentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
