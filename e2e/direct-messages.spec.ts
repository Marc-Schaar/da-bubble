import { test, expect } from './fixtures';

test.describe('Direktnachrichten', () => {
  test('DM aus der Contactbar öffnen, Nachricht senden, Profil öffnen', async ({ loggedInPage: page, seed }) => {
    // Direktnachrichten starts collapsed (NavigationService.isDirectMessagesOpen
    // defaults to false, unlike Channels) so it has to be expanded first.
    await page.getByRole('button', { name: 'Direktnachrichten' }).click();
    await page.locator('.dropdown__list__btn', { hasText: 'Bob Test' }).click();

    await expect(page).toHaveURL(new RegExp(`/main/direct/${seed.users.bob.id}`));

    const text = `DM-Testnachricht ${Date.now()}`;
    await page.locator('textarea[role="combobox"]').first().fill(text);
    await page.getByRole('button', { name: 'Nachricht senden' }).click();
    await expect(page.locator('.message-main', { hasText: text })).toHaveCount(1);

    // Opens the recipient's profile from the chat-direct header (scoped to
    // app-card-header so it doesn't also match the "Bob Test" entry still
    // sitting in the contactbar's direct-messages list).
    await page.locator('app-card-header').getByRole('button', { name: 'Bob Test' }).click();

    const profileDialog = page.getByRole('dialog', { name: 'Profil von Bob Test' });
    await expect(profileDialog).toBeVisible();
    await expect(profileDialog).toContainText('Bob Test');
    await expect(profileDialog).toContainText(seed.users.bob.email);
  });

  test('Neue Nachricht: Empfänger per Suche wählen und senden', async ({ loggedInPage: page, seed }, testInfo) => {
    if (testInfo.project.name === 'mobile') {
      await page.locator('.add-message-btn-mobile').click();
    }
    await expect(page).toHaveURL(/\/main\/new-message/);

    const recipientInput = page.getByLabel('An: #Channel, oder @jemand oder E-Mail-Adresse');
    await recipientInput.fill('Bob');

    const result = page.locator('.tag-container .result-btn', { hasText: 'Bob Test' });
    await expect(result).toBeVisible();
    await result.click();

    const text = `Erste-Nachricht ${Date.now()}`;
    await page.locator('textarea[role="combobox"]').first().fill(text);
    await page.getByRole('button', { name: 'Nachricht senden' }).click();

    await expect(page).toHaveURL(new RegExp(`/main/direct/${seed.users.bob.id}`));
    await expect(page.locator('.message-main', { hasText: text })).toHaveCount(1);
  });
});
