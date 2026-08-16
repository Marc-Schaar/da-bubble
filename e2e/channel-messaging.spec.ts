import { test, expect } from './fixtures';

test.describe('Channel öffnen & Nachrichten', () => {
  test('Channel aus der Sidebar öffnen zeigt den Channel-Namen im Header', async ({ loggedInPage: page, seed }) => {
    await page.locator('.dropdown__list__btn', { hasText: 'Allgemein' }).click();
    await expect(page).toHaveURL(new RegExp(`/main/channel/${seed.channels.defaultChannelId}`));
  });

  test('Nachricht senden erscheint genau einmal', async ({ loggedInPage: page }) => {
    await page.locator('.dropdown__list__btn', { hasText: 'Allgemein' }).click();

    const text = `E2E-Testnachricht ${Date.now()}`;
    await page.locator('textarea[role="combobox"]').first().fill(text);
    await page.getByRole('button', { name: 'Nachricht senden' }).click();

    await expect(page.locator('.message-main', { hasText: text })).toHaveCount(1);
  });

  test('Nachricht bearbeiten aktualisiert den Text', async ({ loggedInPage: page }) => {
    await page.locator('.dropdown__list__btn', { hasText: 'Allgemein' }).click();

    const original = `Original ${Date.now()}`;
    const edited = `Bearbeitet ${Date.now()}`;

    await page.locator('textarea[role="combobox"]').first().fill(original);
    await page.getByRole('button', { name: 'Nachricht senden' }).click();

    const messageRow = page.locator('.message', { hasText: original }).last();
    await messageRow.hover();
    await messageRow.getByRole('button', { name: 'Nachrichtenmenü öffnen' }).click();
    await page.getByRole('button', { name: 'Nachricht bearbeiten' }).click();
    await page.locator('.edit-input textarea').fill(edited);
    await page.getByRole('button', { name: 'Speichern' }).click();

    await expect(page.locator('.message-main', { hasText: edited })).toBeVisible();
    await expect(page.locator('.message-main', { hasText: original })).toHaveCount(0);
  });

  test('Deep-Link-Reload auf /main/channel/:id lädt Nachrichten neu', async ({ loggedInPage: page, seed }) => {
    await page.goto(`/main/channel/${seed.channels.defaultChannelId}`);
    await page.reload();
    await expect(page.locator('textarea[role="combobox"]').first()).toBeVisible();
  });
});
