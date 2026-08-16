import { ChannelMessage, Reaction } from '../app/features/chat/models/channel-message/channel-message';
import { DirectMessage } from '../app/features/chat/models/direct-message/direct-message';

let counter = 0;

/** Builds a ChannelMessage test fixture, with sensible defaults and per-call overrides. */
export function makeChannelMessage(overrides: Partial<{ id: string; name: string; photoUrl: string; message: string; timestamp: unknown; reaction: Reaction[]; thread: { time: string }[] }> = {}): ChannelMessage {
  counter += 1;
  return new ChannelMessage({
    id: `msg-${counter}`,
    name: `Absender ${counter}`,
    photoUrl: 'img/avatars/avatar_1.png',
    message: `Testnachricht ${counter}`,
    timestamp: new Date(),
    reaction: [],
    thread: [],
    ...overrides,
  });
}

/** Builds a DirectMessage test fixture, with sensible defaults and per-call overrides. */
export function makeDirectMessage(overrides: Partial<{ id: string; name: string; photoUrl: string; message: string; timestamp: unknown; from: string; to: string }> = {}): DirectMessage {
  counter += 1;
  return new DirectMessage({
    id: `dm-${counter}`,
    name: `Absender ${counter}`,
    photoUrl: 'img/avatars/avatar_1.png',
    message: `Testnachricht ${counter}`,
    timestamp: new Date(),
    from: 'user-1',
    to: 'user-2',
    ...overrides,
  });
}
