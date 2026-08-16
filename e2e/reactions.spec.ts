import { test, expect } from './fixtures';

const ROCKET = '\u{1F680}'; // 🚀 preselected emoji, only reachable via the full quick-picker
const CHECK_MARK = '\u{2705}'; // ✅ one of the two always-visible quick-react buttons

test.describe('Reaktionen auf Channel-Nachrichten', () => {
  test('Reaktion über den vollen Emoji-Picker hinzufügen, Hover zeigt Namen, erneutes Klicken entfernt sie', async ({
    loggedInPage: page,
  }) => {
    await page.locator('.dropdown__list__btn', { hasText: 'Allgemein' }).click();

    const text = `Reaktions-Testnachricht ${Date.now()}`;
    await page.locator('textarea[role="combobox"]').first().fill(text);
    await page.getByRole('button', { name: 'Nachricht senden' }).click();

    const messageRow = page.locator('.message', { hasText: text }).last();
    await messageRow.hover();

    // Opens the full quick-picker (distinct from the two always-visible
    // quick-react buttons) and picks an emoji only reachable through it.
    await messageRow.getByRole('button', { name: 'Reaktion auswählen' }).click();
    await messageRow.getByRole('button', { name: `Reaktion ${ROCKET}` }).click();

    // The reaction now renders as a chip in the message footer
    // (app-message-reactions), showing the emoji and a count of 1.
    const reactionChip = messageRow.locator('.emoji-box', { hasText: ROCKET });
    await expect(reactionChip).toBeVisible();
    await expect(reactionChip).toContainText('1');

    // Hovering the chip reveals the reactor name via the CSS-hover tooltip
    // (display:none until :hover); the current user renders as "Du".
    const tooltip = reactionChip.locator('.reaction-from-dialog');
    await reactionChip.hover();
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('Du');
    await expect(tooltip).toContainText('reagiert');

    // Clicking the chip again toggles the reaction off (same toggleReaction
    // codepath as adding it) — the chip disappears since it was the only
    // reaction on this message.
    await reactionChip.click();
    await expect(messageRow.locator('.emoji-box', { hasText: ROCKET })).toHaveCount(0);
  });

  test('Schnell-Reaktion (Häkchen) über die Hover-Leiste umschalten', async ({ loggedInPage: page }) => {
    await page.locator('.dropdown__list__btn', { hasText: 'Allgemein' }).click();

    const text = `Quick-Reaktions-Testnachricht ${Date.now()}`;
    await page.locator('textarea[role="combobox"]').first().fill(text);
    await page.getByRole('button', { name: 'Nachricht senden' }).click();

    const messageRow = page.locator('.message', { hasText: text }).last();
    await messageRow.hover();

    const quickReactBtn = messageRow.getByRole('button', { name: `Reaktion ${CHECK_MARK}` });
    await quickReactBtn.click();

    const reactionChip = messageRow.locator('.emoji-box', { hasText: CHECK_MARK });
    await expect(reactionChip).toBeVisible();

    // Toggle off via the same quick-react button.
    await messageRow.hover();
    await messageRow.getByRole('button', { name: `Reaktion ${CHECK_MARK}` }).click();
    await expect(messageRow.locator('.emoji-box', { hasText: CHECK_MARK })).toHaveCount(0);
  });
});
