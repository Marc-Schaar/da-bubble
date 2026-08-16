import { runWrite } from './run-write.util';

describe('runWrite', () => {
  it('resolves with the operation result on success', async () => {
    const result = await runWrite(() => Promise.resolve('ok'), 'Fehler:');
    expect(result).toBe('ok');
  });

  it('does not log anything on success', async () => {
    const consoleSpy = spyOn(console, 'error');
    await runWrite(() => Promise.resolve(42), 'Fehler:');
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('logs the given error message with the underlying error, then rethrows', async () => {
    const consoleSpy = spyOn(console, 'error');
    const underlyingError = new Error('boom');

    await expectAsync(runWrite(() => Promise.reject(underlyingError), 'Fehler beim Schreiben:')).toBeRejectedWith(underlyingError);

    expect(consoleSpy).toHaveBeenCalledWith('Fehler beim Schreiben:', underlyingError);
  });

  it('propagates the exact error message string passed in, unmodified', async () => {
    spyOn(console, 'error');
    const error = new Error('nope');
    try {
      await runWrite(() => Promise.reject(error), 'Custom Fehlermeldung');
    } catch {
      // expected
    }
    expect(console.error).toHaveBeenCalledWith('Custom Fehlermeldung', error);
  });
});
