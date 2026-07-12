import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileStatusComponent } from './profile-status.component';

describe('ProfileStatusComponent', () => {
  let component: ProfileStatusComponent;
  let fixture: ComponentFixture<ProfileStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
