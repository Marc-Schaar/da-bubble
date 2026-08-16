import { signal, WritableSignal } from '@angular/core';

/**
 * Creates a plain writable signal for use as a stand-in wherever a component
 * or service reads `someService.someSignal()`. Tests override the real
 * service via `TestBed.overrideProvider` with a plain object exposing this
 * signal (and any methods under test as jasmine spies) rather than mocking
 * the whole class shape.
 */
export function mockSignal<T>(initial: T): WritableSignal<T> {
  return signal(initial);
}
