import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputComponent } from './input.component';

describe('InputComponent', () => {
  let component: InputComponent;
  let fixture: ComponentFixture<InputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
  });

  function nativeControl(): HTMLInputElement | HTMLTextAreaElement {
    return fixture.nativeElement.querySelector('#' + component.id());
  }

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('rendering: label / icon / prefixText', () => {
    it('renders no <label> when label is not set', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('label')).toBeFalsy();
    });

    it('renders a <label for=id> when label is set', () => {
      fixture.componentRef.setInput('label', 'Email');
      fixture.detectChanges();
      const label = fixture.nativeElement.querySelector('label');
      expect(label?.textContent.trim()).toBe('Email');
      expect(label?.getAttribute('for')).toBe(component.id());
    });

    it('renders no icon by default', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('mat-icon.app-input__icon')).toBeFalsy();
    });

    it('renders a mat-icon prefix when icon is set', () => {
      fixture.componentRef.setInput('icon', 'search');
      fixture.detectChanges();
      const icon = fixture.nativeElement.querySelector('mat-icon.app-input__icon');
      expect(icon?.textContent.trim()).toBe('search');
    });

    it('renders no literal text prefix by default', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.app-input__prefix')).toBeFalsy();
    });

    it('renders a literal text prefix when prefixText is set', () => {
      fixture.componentRef.setInput('prefixText', '@');
      fixture.detectChanges();
      const prefix = fixture.nativeElement.querySelector('.app-input__prefix');
      expect(prefix?.textContent.trim()).toBe('@');
    });
  });

  describe('multiline mode', () => {
    it('renders a native <input> when multiline=false (default)', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('input')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('textarea')).toBeFalsy();
    });

    it('renders a <textarea> when multiline=true', () => {
      fixture.componentRef.setInput('multiline', true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('textarea')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('input')).toBeFalsy();
    });
  });

  describe('invalid + errorMessage', () => {
    it('renders no error message when invalid=false', () => {
      fixture.componentRef.setInput('errorMessage', 'Required');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.app-input__error')).toBeFalsy();
    });

    it('renders no error message when invalid=true but errorMessage is unset', () => {
      fixture.componentRef.setInput('invalid', true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.app-input__error')).toBeFalsy();
    });

    it('renders the error message when invalid=true and errorMessage is set', () => {
      fixture.componentRef.setInput('invalid', true);
      fixture.componentRef.setInput('errorMessage', 'This field is required');
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('.app-input__error');
      expect(error?.textContent.trim()).toBe('This field is required');
      expect(error?.getAttribute('role')).toBe('alert');
    });

    it('sets aria-invalid and aria-describedby on the control when invalid', () => {
      fixture.componentRef.setInput('invalid', true);
      fixture.componentRef.setInput('errorMessage', 'Bad value');
      fixture.detectChanges();
      const control = nativeControl();
      expect(control.getAttribute('aria-invalid')).toBe('true');
      expect(control.getAttribute('aria-describedby')).toBe(component.id() + '-error');
    });

    it('applies the app-input--invalid host class when invalid', () => {
      fixture.componentRef.setInput('invalid', true);
      fixture.detectChanges();
      expect(fixture.nativeElement.classList.contains('app-input--invalid')).toBe(true);
    });
  });

  describe('attribute passthrough', () => {
    it('passes name, aria-label, and autocomplete to the native input', () => {
      fixture.componentRef.setInput('name', 'username');
      fixture.componentRef.setInput('ariaLabel', 'Username field');
      fixture.componentRef.setInput('autocomplete', 'username');
      fixture.detectChanges();

      const control = nativeControl() as HTMLInputElement;
      expect(control.getAttribute('name')).toBe('username');
      expect(control.getAttribute('aria-label')).toBe('Username field');
      expect(control.getAttribute('autocomplete')).toBe('username');
    });

    it('passes name and aria-label to the textarea when multiline (textarea has no autocomplete binding)', () => {
      fixture.componentRef.setInput('multiline', true);
      fixture.componentRef.setInput('name', 'bio');
      fixture.componentRef.setInput('ariaLabel', 'Bio field');
      fixture.detectChanges();

      const control = nativeControl() as HTMLTextAreaElement;
      expect(control.getAttribute('name')).toBe('bio');
      expect(control.getAttribute('aria-label')).toBe('Bio field');
      expect(control.hasAttribute('autocomplete')).toBe(false);
    });

    it('passes role, aria-expanded, aria-controls, aria-activedescendant through', () => {
      fixture.componentRef.setInput('role', 'combobox');
      fixture.componentRef.setInput('ariaExpanded', true);
      fixture.componentRef.setInput('ariaControls', 'listbox-1');
      fixture.componentRef.setInput('ariaActivedescendant', 'option-3');
      fixture.detectChanges();

      const control = nativeControl();
      expect(control.getAttribute('role')).toBe('combobox');
      expect(control.getAttribute('aria-expanded')).toBe('true');
      expect(control.getAttribute('aria-controls')).toBe('listbox-1');
      expect(control.getAttribute('aria-activedescendant')).toBe('option-3');
    });

    it('passes the type input to the native input element', () => {
      fixture.componentRef.setInput('type', 'email');
      fixture.detectChanges();
      const control = nativeControl() as HTMLInputElement;
      expect(control.type).toBe('email');
    });

    it('passes placeholder through', () => {
      fixture.componentRef.setInput('placeholder', 'Enter value');
      fixture.detectChanges();
      expect(nativeControl().getAttribute('placeholder')).toBe('Enter value');
    });

    it('applies the app-input--filled host class when appearance="filled"', () => {
      fixture.componentRef.setInput('appearance', 'filled');
      fixture.detectChanges();
      expect(fixture.nativeElement.classList.contains('app-input--filled')).toBe(true);
    });

    it('does not apply the app-input--filled host class for the default "outline" appearance', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.classList.contains('app-input--filled')).toBe(false);
    });
  });

  describe('ControlValueAccessor', () => {
    it('writeValue sets the internal value and reflects it on the native control', () => {
      fixture.detectChanges();
      component.writeValue('hello');
      fixture.detectChanges();
      expect((nativeControl() as HTMLInputElement).value).toBe('hello');
    });

    it('writeValue(null/undefined) falls back to an empty string', () => {
      fixture.detectChanges();
      component.writeValue(null as any);
      fixture.detectChanges();
      expect(component.value()).toBe('');
    });

    it('registerOnChange callback fires with the new value on user input', () => {
      fixture.detectChanges();
      const onChange = jasmine.createSpy('onChange');
      component.registerOnChange(onChange);

      const control = nativeControl() as HTMLInputElement;
      control.value = 'typed value';
      control.dispatchEvent(new Event('input'));

      expect(onChange).toHaveBeenCalledWith('typed value');
      expect(component.value()).toBe('typed value');
    });

    it('registerOnTouched callback fires on blur', () => {
      fixture.detectChanges();
      const onTouched = jasmine.createSpy('onTouched');
      component.registerOnTouched(onTouched);

      const control = nativeControl() as HTMLInputElement;
      control.dispatchEvent(new Event('blur'));

      expect(onTouched).toHaveBeenCalled();
    });

    it('setDisabledState(true) disables the native control', () => {
      fixture.detectChanges();
      component.setDisabledState(true);
      fixture.detectChanges();
      expect((nativeControl() as HTMLInputElement).disabled).toBe(true);
      expect(fixture.nativeElement.classList.contains('app-input--disabled')).toBe(true);
    });

    it('setDisabledState(false) re-enables the native control (unless disabledAttr is also set)', () => {
      fixture.detectChanges();
      component.setDisabledState(true);
      fixture.detectChanges();
      component.setDisabledState(false);
      fixture.detectChanges();
      expect((nativeControl() as HTMLInputElement).disabled).toBe(false);
    });

    it('combines form-disabled state with the disabled input attribute (either one disables)', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      expect((nativeControl() as HTMLInputElement).disabled).toBe(true);
      expect(component.disabled()).toBe(true);
    });
  });

  describe('focus event output', () => {
    it('emits "focused" with the FocusEvent when the native control is focused', () => {
      fixture.detectChanges();
      let emittedEvent: FocusEvent | undefined;
      component.focused.subscribe((e) => (emittedEvent = e));

      const control = nativeControl() as HTMLInputElement;
      const focusEvent = new FocusEvent('focus');
      control.dispatchEvent(focusEvent);

      expect(emittedEvent).toBe(focusEvent);
    });
  });

  describe('focus() public method', () => {
    it('delegates to the native control .focus()', () => {
      fixture.detectChanges();
      const control = nativeControl() as HTMLInputElement;
      spyOn(control, 'focus');
      component.focus();
      expect(control.focus).toHaveBeenCalled();
    });

    it('delegates to the native textarea .focus() in multiline mode', () => {
      fixture.componentRef.setInput('multiline', true);
      fixture.detectChanges();
      const control = nativeControl() as HTMLTextAreaElement;
      spyOn(control, 'focus');
      component.focus();
      expect(control.focus).toHaveBeenCalled();
    });
  });

  describe('id generation', () => {
    it('defaults to a unique auto-generated id prefixed with "app-input-"', () => {
      fixture.detectChanges();
      expect(component.id()).toMatch(/^app-input-\d+$/);
    });

    it('accepts an explicit id override', () => {
      fixture.componentRef.setInput('id', 'custom-id');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('#custom-id')).toBeTruthy();
    });
  });
});
