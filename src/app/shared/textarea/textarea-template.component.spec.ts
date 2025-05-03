import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextareaTemplateComponent } from './textarea-template.component';

describe('TextareaTemplateComponent', () => {
  let component: TextareaTemplateComponent;
  let fixture: ComponentFixture<TextareaTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextareaTemplateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextareaTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
