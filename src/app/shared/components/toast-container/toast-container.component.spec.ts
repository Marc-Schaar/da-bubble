import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToastContainerComponent } from './toast-container.component';
import { NotificationService, Toast } from '../../services/notification/notification.service';
import { mockSignal } from '../../../../testing/signal-service-mock.util';

describe('ToastContainerComponent', () => {
  let component: ToastContainerComponent;
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toastsSignal: ReturnType<typeof mockSignal<Toast[]>>;
  let notificationServiceSpy: {
    toasts: ReturnType<typeof mockSignal<Toast[]>>;
    requestDismiss: jasmine.Spy;
    dismiss: jasmine.Spy;
  };

  function makeToast(overrides: Partial<Toast> = {}): Toast {
    return { id: 1, message: 'Hallo', variant: 'success', leaving: false, ...overrides };
  }

  beforeEach(async () => {
    toastsSignal = mockSignal<Toast[]>([]);
    notificationServiceSpy = {
      toasts: toastsSignal,
      requestDismiss: jasmine.createSpy('requestDismiss'),
      dismiss: jasmine.createSpy('dismiss'),
    };

    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
      providers: [{ provide: NotificationService, useValue: notificationServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders no toast elements when the store is empty', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.toast');
    expect(buttons.length).toBe(0);
  });

  it('renders one element per toast in the store', () => {
    toastsSignal.set([makeToast({ id: 1, message: 'Erste' }), makeToast({ id: 2, message: 'Zweite' })]);
    fixture.detectChanges();

    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.toast');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent?.trim()).toBe('Erste');
    expect(buttons[1].textContent?.trim()).toBe('Zweite');
  });

  it('applies the success/error variant classes', () => {
    toastsSignal.set([makeToast({ id: 1, variant: 'success' }), makeToast({ id: 2, variant: 'error' })]);
    fixture.detectChanges();

    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.toast');
    expect(buttons[0].classList.contains('toast--success')).toBeTrue();
    expect(buttons[0].classList.contains('toast--error')).toBeFalse();
    expect(buttons[1].classList.contains('toast--error')).toBeTrue();
    expect(buttons[1].classList.contains('toast--success')).toBeFalse();
  });

  it('applies the leaving class/state when toast.leaving is true', () => {
    toastsSignal.set([makeToast({ id: 1, leaving: false }), makeToast({ id: 2, leaving: true })]);
    fixture.detectChanges();

    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.toast');
    expect(buttons[0].classList.contains('toast--leaving')).toBeFalse();
    expect(buttons[1].classList.contains('toast--leaving')).toBeTrue();
  });

  it('clicking a toast calls requestDismiss with its id', () => {
    toastsSignal.set([makeToast({ id: 42 })]);
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.toast');
    button.click();

    expect(notificationServiceSpy.requestDismiss).toHaveBeenCalledOnceWith(42);
    expect(notificationServiceSpy.dismiss).not.toHaveBeenCalled();
  });

  it('animationend on a leaving toast calls dismiss with its id (slide-out finished)', () => {
    const toast = makeToast({ id: 7, leaving: true });
    toastsSignal.set([toast]);
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.toast');
    button.dispatchEvent(new AnimationEvent('animationend'));

    expect(notificationServiceSpy.dismiss).toHaveBeenCalledOnceWith(7);
  });

  it('animationend on a non-leaving toast (entrance animation) does not call dismiss', () => {
    const toast = makeToast({ id: 9, leaving: false });
    toastsSignal.set([toast]);
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.toast');
    button.dispatchEvent(new AnimationEvent('animationend'));

    expect(notificationServiceSpy.dismiss).not.toHaveBeenCalled();
  });

  it('aria-live region is present for accessibility', () => {
    const region = fixture.nativeElement.querySelector('[role="status"][aria-live="polite"]');
    expect(region).toBeTruthy();
  });
});
