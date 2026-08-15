/**
 * Deterministic 1:1-conversation id: both participants' uids, sorted so
 * either direction of the pair resolves to the same id.
 */
export function getConversationId(userA: string, userB: string): string {
  const [uid1, uid2] = [userA, userB].sort();
  return `${uid1}_${uid2}`;
}
