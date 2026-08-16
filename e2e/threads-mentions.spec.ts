import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

/**
 * Sends a message from the channel compose textarea containing exactly one
 * `@user` or `#channel` mention, inserted the same way a real user would:
 * clicking the trigger icon (rather than typing the trigger character)
 * opens the suggestion dropdown, then clicking the suggestion tags it in.
 * `formatMentionMarkers` (TextareaTemplateComponent.newMessage) appends the
 * trailing "//" marker on send, which is what makes LinkifyPipe render the
 * mention as a clickable `.tag-btn` instead of plain text.
 */
async function sendMessageWithMention(
  page: Page,
  triggerAriaLabel: 'Person erwähnen' | 'Channel erwähnen',
  suggestionText: string,
  trailingText: string,
): Promise<string> {
  const textarea = page.locator('textarea[role="combobox"]').first();
  await textarea.click();
  await page.getByRole('button', { name: triggerAriaLabel }).click();

  const tagContainer = page.locator('.tag-container');
  await expect(tagContainer).toBeVisible();
  await tagContainer.locator('.result-btn', { hasText: suggestionText }).click();
  await expect(tagContainer).toBeHidden();

  await textarea.pressSequentially(trailingText);
  const finalValue = await textarea.inputValue();
  await page.getByRole('button', { name: 'Nachricht senden' }).click();
  return finalValue;
}

test.describe('Threads', () => {
  test('Thread öffnen, antworten, schließen', async ({ loggedInPage: page }, testInfo) => {
    await page.locator('.dropdown__list__btn', { hasText: 'Allgemein' }).click();

    const parentText = `Thread-Parent ${Date.now()}`;
    await page.locator('textarea[role="combobox"]').first().fill(parentText);
    await page.getByRole('button', { name: 'Nachricht senden' }).click();

    const messageRow = page.locator('.message', { hasText: parentText }).last();
    await messageRow.hover();
    await messageRow.getByRole('button', { name: 'Thread öffnen' }).click();

    const thread = page.locator('app-thread');
    await expect(thread).toContainText(parentText);
    await expect(page).toHaveURL(/messageId=/);

    const replyText = `Thread-Antwort ${Date.now()}`;
    await thread.locator('textarea[role="combobox"]').fill(replyText);
    await thread.getByRole('button', { name: 'Nachricht senden' }).click();
    await expect(thread.locator('.message-main', { hasText: replyText })).toBeVisible();
    await expect(thread).toContainText('1 Antworten');

    if (testInfo.project.name === 'mobile') {
      await thread.getByRole('button', { name: 'Zurück' }).click();
    } else {
      await page.getByRole('button', { name: 'Thread schließen' }).click();
    }
    await expect(page).not.toHaveURL(/messageId=/);
  });

  test('Channel wechseln bei offenem Thread zeigt keinen veralteten Thread-Inhalt', async ({ loggedInPage: page, seed }) => {
    await page.locator('.dropdown__list__btn', { hasText: 'Allgemein' }).click();

    const parentText = `Stale-Thread-Check ${Date.now()}`;
    await page.locator('textarea[role="combobox"]').first().fill(parentText);
    await page.getByRole('button', { name: 'Nachricht senden' }).click();

    const messageRow = page.locator('.message', { hasText: parentText }).last();
    await messageRow.hover();
    await messageRow.getByRole('button', { name: 'Thread öffnen' }).click();
    await expect(page.locator('app-thread')).toContainText(parentText);

    // selectChannel() (fired by the sidebar click) navigates to
    // /main/channel/:id without merging query params, so messageId is
    // dropped and NavigationService.isThreadOpen flips back to false —
    // switching channels always closes a stale thread as a side effect.
    await page.locator('.dropdown__list__btn', { hasText: 'Entwicklerteam' }).click();
    await expect(page).toHaveURL(new RegExp(`/main/channel/${seed.channels.secondChannelId}`));
    await expect(page).not.toHaveURL(/messageId=/);
    await expect(page.locator('app-thread')).not.toContainText(parentText);
  });
});

test.describe('Mentions', () => {
  test('@user-Mention klicken navigiert zur Direktnachricht mit diesem Nutzer', async ({ loggedInPage: page, seed }) => {
    await page.locator('.dropdown__list__btn', { hasText: 'Allgemein' }).click();

    await sendMessageWithMention(page, 'Person erwähnen', 'Bob Test', 'hallo');

    // NOTE: the REFACTORING.md smoke-test checklist describes this as
    // opening the profile dialog, but MentionService.navigateToMention's
    // '@' branch actually calls selectDirectMessageRecipient — clicking an
    // @mention navigates straight to the DM with that user. Asserting the
    // real behaviour here.
    const tagBtn = page.locator('.tag-btn', { hasText: '@Bob Test' }).last();
    await expect(tagBtn).toBeVisible();
    await tagBtn.click();

    await expect(page).toHaveURL(new RegExp(`/main/direct/${seed.users.bob.id}`));
  });

  test('#channel-Mention klicken navigiert zu diesem Channel', async ({ loggedInPage: page, seed }) => {
    await page.locator('.dropdown__list__btn', { hasText: 'Allgemein' }).click();

    await sendMessageWithMention(page, 'Channel erwähnen', 'Entwicklerteam', 'schau mal hier');

    const tagBtn = page.locator('.tag-btn', { hasText: '#Entwicklerteam' }).last();
    await expect(tagBtn).toBeVisible();
    await tagBtn.click();

    await expect(page).toHaveURL(new RegExp(`/main/channel/${seed.channels.secondChannelId}`));
  });
});
