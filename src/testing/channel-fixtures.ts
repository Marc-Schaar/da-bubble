import { Channel } from '../app/features/channel/models/channel/channel';

let counter = 0;

/** Builds a valid Channel test fixture, with sensible defaults and per-call overrides. */
export function makeChannel(overrides: Partial<Channel> = {}): Channel {
  counter += 1;
  return {
    id: `channel-${counter}`,
    name: `Testchannel ${counter}`,
    description: '',
    member: [{ id: 'user-1' }],
    createdAt: new Date(),
    createdBy: 'user-1',
    ...overrides,
  };
}
