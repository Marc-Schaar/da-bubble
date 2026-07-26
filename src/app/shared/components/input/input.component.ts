import { booleanAttribute, ChangeDetectionStrategy, Component, computed, forwardRef, input, output, signal } from '@angular/core';
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

  focused = output<FocusEvent>();

  value = signal('');
  private formDisabled = signal(false);
  disabled = computed(() => this.formDisabled() || this.disabledAttr());

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  onInput(value: string): void {
    this.value.set(value);
    this.onChange(value);
  }

  onBlur(): void {
    this.onTouched();
  }

  onFocus(event: FocusEvent): void {
    this.focused.emit(event);
  }
}
