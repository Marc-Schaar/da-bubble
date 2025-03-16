import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvatarselectionComponent } from './avatar-selection.component';

describe('AvatarselectionComponent', () => {
  let component: AvatarselectionComponent;
  let fixture: ComponentFixture<AvatarselectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarselectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvatarselectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
