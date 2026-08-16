import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  it('starts with no toasts', () => {
    expect(service.toasts()).toEqual([]);
  });

  describe('success()', () => {
    it('pushes a toast with variant "success", leaving:false and the message', () => {
      service.success('Saved!');
      const toasts = service.toasts();
      expect(toasts.length).toBe(1);
      expect(toasts[0].message).toBe('Saved!');
      expect(toasts[0].variant).toBe('success');
      expect(toasts[0].leaving).toBeFalse();
    });
  });

  describe('error()', () => {
    it('pushes a toast with variant "error", leaving:false and the message', () => {
      service.error('Something broke');
      const toasts = service.toasts();
      expect(toasts.length).toBe(1);
      expect(toasts[0].message).toBe('Something broke');
      expect(toasts[0].variant).toBe('error');
      expect(toasts[0].leaving).toBeFalse();
    });
  });

  it('assigns incrementing ids across successive toasts', () => {
    service.success('one');
    service.error('two');
    service.success('three');
    const ids = service.toasts().map((t) => t.id);
    expect(ids).toEqual([0, 1, 2]);
  });

  describe('requestDismiss()', () => {
    it('flips only the matching toast\'s leaving flag to true, others untouched', () => {
      service.success('one');
      service.error('two');
      const secondId = service.toasts()[1].id;

      service.requestDismiss(secondId);

      const toasts = service.toasts();
      expect(toasts[0].leaving).toBeFalse();
      expect(toasts[1].leaving).toBeTrue();
    });

    it('is a no-op for an unknown id (does not throw, does not affect other toasts)', () => {
      service.success('one');
      expect(() => service.requestDismiss(9999)).not.toThrow();
      expect(service.toasts()[0].leaving).toBeFalse();
      expect(service.toasts().length).toBe(1);
    });
  });

  describe('dismiss()', () => {
    it('removes only the matching toast', () => {
      service.success('one');
      service.error('two');
      const firstId = service.toasts()[0].id;

      service.dismiss(firstId);

      const toasts = service.toasts();
      expect(toasts.length).toBe(1);
      expect(toasts[0].message).toBe('two');
    });

    it('dismissing an already-removed id is a no-op: does not throw and does not affect other toasts', () => {
      service.success('one');
      service.error('two');
      const firstId = service.toasts()[0].id;

      service.dismiss(firstId);
      expect(() => service.dismiss(firstId)).not.toThrow();

      const toasts = service.toasts();
      expect(toasts.length).toBe(1);
      expect(toasts[0].message).toBe('two');
    });
  });

  describe('auto-dismiss after 3000ms', () => {
    beforeEach(() => {
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('marks a success toast as leaving after 3000ms', () => {
      service.success('auto');
      const id = service.toasts()[0].id;
      expect(service.toasts()[0].leaving).toBeFalse();

      jasmine.clock().tick(3000);

      expect(service.toasts().find((t) => t.id === id)?.leaving).toBeTrue();
    });

    it('marks an error toast as leaving after 3000ms', () => {
      service.error('auto-error');
      const id = service.toasts()[0].id;
      expect(service.toasts()[0].leaving).toBeFalse();

      jasmine.clock().tick(3000);

      expect(service.toasts().find((t) => t.id === id)?.leaving).toBeTrue();
    });

    it('does not mark the toast as leaving before 3000ms elapse', () => {
      service.success('auto');
      jasmine.clock().tick(2999);
      expect(service.toasts()[0].leaving).toBeFalse();
    });
  });
});
