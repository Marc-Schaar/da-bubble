import { test, expect, loginAs, TEST_USERS } from './fixtures';

test.describe('Authentifizierung', () => {
  test('Login mit E-Mail und Passwort führt zu /main', async ({ page, seed }) => {
    void seed;
    await loginAs(page, TEST_USERS[0].email, TEST_USERS[0].password);
    await expect(page).toHaveURL(/\/main/);
  });

  test('Login mit falschem Passwort zeigt Fehlermeldung und bleibt auf /login', async ({ page, seed }) => {
    void seed;
    await page.goto('/login');
    await page.getByLabel('E-Mail-Adresse').fill(TEST_USERS[0].email);
    await page.getByLabel('Passwort').fill('falsches-passwort');
    await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
    await expect(page.getByText(/Falsches Passwort oder E-Mail/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('Gäste-Login führt direkt zu /main ohne Formulareingabe', async ({ page, seed }) => {
    void seed;
    await page.goto('/login');
    await page.getByRole('button', { name: 'Gäste-Login' }).click();
    await expect(page).toHaveURL(/\/main/);
  });

  test('Logout führt zurück zur Login-Seite; erneuter Login funktioniert', async ({ loggedInPage: page }, testInfo) => {
    const trigger =
      testInfo.project.name === 'mobile'
        ? page.locator('.menu__triger__btn, app-header-user-menu button').first()
        : page.locator('.menu__triger__btn');
    const logOutButton = page.getByRole('button', { name: /log out/i });

    // MatMenu/MatBottomSheet overlays can take a moment to attach on a cold dev-server
    // compile; retry the trigger click until the overlay's "Log out" button is visible.
    await expect(async () => {
      await trigger.click();
      await expect(logOutButton).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 20_000 });

    await logOutButton.click();
    await expect(page).toHaveURL(/\/login/);

    await loginAs(page, TEST_USERS[0].email, TEST_USERS[0].password);
    await expect(page).toHaveURL(/\/main/);
  });

  test('Deep-Link-Reload auf /main/channel/:id bleibt eingeloggt', async ({ loggedInPage: page, seed }) => {
    await page.goto(`/main/channel/${seed.channels.defaultChannelId}`);
    await page.reload();
    await expect(page).toHaveURL(new RegExp(`/main/channel/${seed.channels.defaultChannelId}`));
    await expect(page.getByText('Allgemein').first()).toBeVisible();
  });
});
