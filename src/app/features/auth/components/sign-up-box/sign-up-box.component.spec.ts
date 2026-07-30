import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignUpBoxComponent } from './sign-up-box.component';

describe('SignUpBoxComponent', () => {
  let component: SignUpBoxComponent;
  let fixture: ComponentFixture<SignUpBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignUpBoxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SignUpBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
