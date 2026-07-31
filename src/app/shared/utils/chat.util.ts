import { BaseMessage } from '../../features/chat/models/base-message/base-message';

/**
 * Compares two messages and checks whether they were sent on different calendar days.
 */
export function isNewDay(currentMsg: BaseMessage, previousMsg: BaseMessage | null): boolean {
  if (!previousMsg) return true;

  const current = currentMsg.asDate;
  const previous = previousMsg.asDate;

  return (
    current.getDate() !== previous.getDate() ||
    current.getMonth() !== previous.getMonth() ||
    current.getFullYear() !== previous.getFullYear()
  );
}
