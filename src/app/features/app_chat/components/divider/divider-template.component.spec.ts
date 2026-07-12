import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DividerTemplateComponent } from './divider-template.component';

describe('DividerTemplateComponent', () => {
  let component: DividerTemplateComponent;
  let fixture: ComponentFixture<DividerTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DividerTemplateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DividerTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
