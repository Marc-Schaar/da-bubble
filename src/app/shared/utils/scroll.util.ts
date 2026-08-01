/**
 * Scrolls the chat content area to the bottom.
 */
export function scrollToBottom(ref: HTMLElement | null): void {
  if (!ref) return;
  setTimeout(() => {
    ref.scrollTop = ref.scrollHeight;
  }, 0);
}

/**
 * Scrolls the chat content area to the bottom only if the user is already
 * near it — avoids yanking the view down while someone is reading history.
 */
export function scrollToBottomIfNear(ref: HTMLElement | null, threshold = 100): void {
  if (!ref) return;
  const isNearBottom = ref.scrollHeight - ref.scrollTop - ref.clientHeight < threshold;
  if (isNearBottom) scrollToBottom(ref);
}
