import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

let uid = 0;

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-input--filled]': "appearance() === 'filled'",
    '[class.app-input--invalid]': 'invalid()',
    '[class.app-input--disabled]': 'disabled()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
})
export class InputComponent implements ControlValueAccessor {
  id = input(`app-input-${uid++}`);
  type = input('text');
  placeholder = input('');
  ariaLabel = input<string | null>(null);
  label = input<string | null>(null);
  name = input<string | null>(null);
  autocomplete = input<string | null>(null);
  appearance = input<'filled' | 'outline'>('outline');
  icon = input<string | null>(null);
  prefixText = input<string | null>(null);
  multiline = input(false, { transform: booleanAttribute });
  invalid = input(false, { transform: booleanAttribute });
  errorMessage = input<string | null>(null);
  disabledAttr = input(false, { alias: 'disabled', transform: booleanAttribute });
  role = input<string | null>(null);
  ariaExpanded = input<boolean | null>(null);
  ariaControls = input<string | null>(null);
  ariaActivedescendant = input<string | null>(null);

  focused = output<FocusEvent>();

  @ViewChild('control') private controlRef?: ElementRef<HTMLInputElement | HTMLTextAreaElement>;

  value = signal('');
  private formDisabled = signal(false);
  disabled = computed(() => this.formDisabled() || this.disabledAttr());

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  /**
   * Writes a value from the outside form model into the component.
   */
  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  /**
   * Registers the callback to call when the control value changes.
   */
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  /**
   * Registers the callback to call when the control is touched.
   */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /**
   * Enables or disables the input based on the form state.
   */
  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  /**
   * Handles user input events and propagates the changed value.
   */
  onInput(value: string): void {
    this.value.set(value);
    this.onChange(value);
  }

  /**
   * Marks the control as touched when it loses focus.
   */
  onBlur(): void {
    this.onTouched();
  }

  /**
   * Emits focus events for the host input element.
   */
  onFocus(event: FocusEvent): void {
    this.focused.emit(event);
  }

  /**
   * Focuses the underlying native control; called by parent components to autofocus this input.
   */
  public focus(): void {
    this.controlRef?.nativeElement.focus();
  }
}
