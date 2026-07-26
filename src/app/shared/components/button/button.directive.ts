import { Directive, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'outline' | 'icon' | 'plain';

/**
 * Attaches to a native `<button>` to apply the shared variant styling
 * (primary/outline) and default to `type="button"` so buttons never
 * accidentally submit an enclosing form. Deliberately a directive, not a
 * wrapping component: buttons sit inside dozens of different flex/grid
 * layouts and bespoke modifier classes across this app, and a wrapper
 * component would either break layout participation (`:host` becomes the
 * flex item instead of the button) or — with `display: contents` to avoid
 * that — silently fail to render any visual class landed on the host. A
 * directive enhances the real button element in place, so every existing
 * class/attribute/binding on it keeps working untouched.
 *
 * `variant="icon"` and `variant="plain"` add no CSS of their own — icon
 * buttons already carry their own sizing/hover class (`btn-secundary`,
 * `hover-to-dark-purple`, or a per-component class) and plain buttons
 * (e.g. a dropdown menu item) style themselves via a parent selector —
 * both just suppress the pill-shaped `.btn`/`.btn-primary`/`.btn-outline`
 * classes and enforce `type="button"`. The two names exist for reader
 * intent (icon-only vs. text) even though they behave identically today.
 */
@Directive({
  selector: 'button[appButton]',
  standalone: true,
  host: {
    '[class.btn]': 'variant() !== "icon"',
    '[class.btn-primary]': 'variant() === "primary"',
    '[class.btn-outline]': 'variant() === "outline"',
    '[attr.type]': 'type()',
  },
})
export class ButtonDirective {
  variant = input<ButtonVariant>('primary');
  type = input<'button' | 'submit'>('button');
}
