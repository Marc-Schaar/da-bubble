import { Directive, HostAttributeToken, inject, input } from '@angular/core';

let uid = 0;

/**
 * Attaches to a native `<input>` (or `<textarea>`) instead of wrapping it,
 * for the same reason as `[appButton]`: form fields sit inside dozens of
 * different bespoke layouts (icon-prefixed rows, search bars, labeled
 * boxes), and a wrapper component would fight that markup instead of
 * fitting into it. `formControlName`/`[(ngModel)]` already work on a plain
 * native input via Angular's built-in value accessor — this directive only
 * adds what was actually missing: a stable `id` (reused if one is already
 * set, e.g. for an existing `<label for>`, otherwise generated) and
 * `aria-invalid`/`aria-describedby` wired to the paired `app-field-error`.
 * Read `id` off the exported directive instance (`#f="appInput"`) to link
 * a `<label [for]="f.id">` or `[id]="f.id + '-error'"` on the error slot.
 */
@Directive({
  selector: 'input[appInput], textarea[appInput]',
  standalone: true,
  exportAs: 'appInput',
  host: {
    '[attr.id]': 'id',
    '[attr.aria-invalid]': 'invalid() ? true : null',
    '[attr.aria-describedby]': 'invalid() ? id + "-error" : null',
    '[class.input-invalid]': 'invalid()',
  },
})
export class InputDirective {
  invalid = input<boolean>(false);
  readonly id = inject(new HostAttributeToken('id'), { optional: true }) || `app-input-${uid++}`;
}
