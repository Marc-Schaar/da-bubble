import { Channel } from '../../features/channel/models/channel/channel';
import { User } from '../../features/auth/models/user/user';

/**
 * Type guard distinguishing a Channel from a User in the mixed lists used by
 * search, mentions, and the "new message" receiver picker. Previously
 * reimplemented (with slightly different checks) in search-result and
 * chat-new; a Channel is the only one of the two with a `member` array.
 */
export function isChannel(element: Channel | User | null | undefined): element is Channel {
  return !!element && 'member' in element;
}

/**
 * Type guard for the User side of the same Channel/User union.
 */
export function isUser(element: Channel | User | null | undefined): element is User {
  return !!element && 'displayName' in element;
}
