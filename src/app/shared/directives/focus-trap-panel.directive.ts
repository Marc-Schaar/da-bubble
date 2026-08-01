import { booleanAttribute, Directive, DestroyRef, effect, ElementRef, inject, input, output } from '@angular/core';
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';

/**
 * Traps keyboard focus inside the host element while open, restores focus to
 * whatever triggered it on close, and marks it `inert` while closed so it
 * can never be reached by Tab even if it stays mounted in the DOM.
 *
 * Works for both element shapes used in this app: elements created/destroyed
 * via `@if` (default `true`, no binding needed — mounting is opening) and
 * elements that stay permanently in the DOM and are only toggled via CSS
 * (bind `[appFocusTrapPanel]="isOpen()"`).
 */
@Directive({
  selector: '[appFocusTrapPanel]',
  host: {
    '(keydown.escape)': 'onEscape($event)',
  },
})
export class FocusTrapPanelDirective {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly focusTrapFactory = inject(FocusTrapFactory);

  public readonly appFocusTrapPanel = input(true, { transform: booleanAttribute });
  public readonly panelClose = output<void>();

  private focusTrap?: FocusTrap;
  private triggerElement: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (this.appFocusTrapPanel()) {
        this.activate();
      } else {
        this.deactivate();
      }
    });

    inject(DestroyRef).onDestroy(() => this.deactivate());
  }

  protected onEscape(event: KeyboardEvent): void {
    if (!this.appFocusTrapPanel()) return;
    event.stopPropagation();
    this.panelClose.emit();
  }

  private activate(): void {
    if (this.focusTrap) return;
    const element = this.elementRef.nativeElement;
    this.triggerElement = document.activeElement as HTMLElement | null;
    element.removeAttribute('inert');
    this.focusTrap = this.focusTrapFactory.create(element);
    this.focusTrap.focusInitialElementWhenReady();
  }

  private deactivate(): void {
    this.elementRef.nativeElement.setAttribute('inert', '');
    if (!this.focusTrap) return;
    this.focusTrap.destroy();
    this.focusTrap = undefined;
    this.triggerElement?.focus();
    this.triggerElement = null;
  }
}
