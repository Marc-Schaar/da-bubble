import { toEntity } from './firestore-entity.util';

describe('toEntity', () => {
  it('merges the given id into the data object', () => {
    const result = toEntity<{ id: string; name: string }>('abc123', { name: 'Allgemein' });
    expect(result).toEqual({ id: 'abc123', name: 'Allgemein' });
  });

  it('lets the doc id win over a same-named field in the data', () => {
    const result = toEntity<{ id: string }>('real-id', { id: 'spoofed-id' });
    expect(result.id).toBe('real-id');
  });

  it('handles an empty data object', () => {
    const result = toEntity<{ id: string }>('only-id', {});
    expect(result).toEqual({ id: 'only-id' });
  });

  it('preserves nested/array fields from the data object untouched', () => {
    const data = { member: [{ id: 'u1' }, { id: 'u2' }], tags: ['a', 'b'] };
    const result = toEntity<{ id: string; member: { id: string }[]; tags: string[] }>('c1', data);
    expect(result.member).toEqual(data.member);
    expect(result.tags).toEqual(data.tags);
    expect(result.id).toBe('c1');
  });
});
