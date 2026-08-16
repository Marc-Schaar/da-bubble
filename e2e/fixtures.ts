import { test as base, expect, type Page } from '@playwright/test';
import { resetEmulatorAndSeed, TEST_USERS } from './lib/seed-emulator.mjs';

type Fixtures = {
  seed: Awaited<ReturnType<typeof resetEmulatorAndSeed>>;
  loggedInPage: Page;
};

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('E-Mail-Adresse').fill(email);
  await page.getByLabel('Passwort').fill(password);
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page).toHaveURL(/\/main/);
}

export const test = base.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  seed: async ({}, use) => {
    const result = await resetEmulatorAndSeed();
    await use(result);
  },
  loggedInPage: async ({ page, seed }, use) => {
    await loginAs(page, TEST_USERS[0].email, TEST_USERS[0].password);
    void seed;
    await use(page);
  },
});

export { expect };
export { TEST_USERS };
export { loginAs };
