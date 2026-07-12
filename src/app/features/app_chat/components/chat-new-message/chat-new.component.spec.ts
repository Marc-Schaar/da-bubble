import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewmessageComponent } from './chat-new.component';

describe('NewmessageComponent', () => {
  let component: NewmessageComponent;
  let fixture: ComponentFixture<NewmessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewmessageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NewmessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
