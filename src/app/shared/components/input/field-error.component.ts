import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Renders a form field's error message in a consistent, accessible slot.
 * Pairs with `[appInput]`'s auto-generated `id + '-error'` via
 * `aria-describedby` — the parent still decides *which* message to show,
 * since validation messages differ per field; this only owns the repeated
 * rendering + ARIA wiring that was duplicated across every form.
 */
@Component({
  selector: 'app-field-error',
  standalone: true,
  templateUrl: './field-error.component.html',
  styleUrl: './field-error.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldErrorComponent {
  message = input<string | null>(null);
  id = input.required<string>();
}
