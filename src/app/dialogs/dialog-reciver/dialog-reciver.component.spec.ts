import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogReciverComponent } from './dialog-reciver.component';

describe('DialogReciverComponent', () => {
  let component: DialogReciverComponent;
  let fixture: ComponentFixture<DialogReciverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogReciverComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogReciverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
