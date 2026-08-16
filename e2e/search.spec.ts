import type { Page, TestInfo } from '@playwright/test';
import { test, expect } from './fixtures';

/**
 * Fills the header search field, wherever it lives for this viewport:
 * desktop renders it via app-header-search (aria-label "Devspace
 * durchsuchen"); mobile renders an inline search bar in the contactbar
 * itself (aria-label "Gehe zu ..."), gated behind isClicked, which is only
 * set true by an actual click on the field (not by focus-via-fill alone).
 */
async function searchHeader(page: Page, testInfo: TestInfo, query: string) {
  const input = testInfo.project.name === 'mobile' ? page.getByLabel('Gehe zu ...') : page.getByLabel('Devspace durchsuchen');
  await input.click();
  await input.fill(query);
}

test.describe('Header-Suche', () => {
  test('Nutzer suchen und Ergebnis anklicken navigiert zur Direktnachricht', async ({ loggedInPage: page, seed }, testInfo) => {
    await searchHeader(page, testInfo, 'Bob');

    const result = page.locator('.tag-container .result-btn', { hasText: 'Bob Test' });
    await expect(result).toBeVisible();
    await result.click();

    await expect(page).toHaveURL(new RegExp(`/main/direct/${seed.users.bob.id}`));
  });

  test('Channel suchen und Ergebnis anklicken navigiert zum Channel', async ({ loggedInPage: page, seed }, testInfo) => {
    await searchHeader(page, testInfo, 'Entwicklerteam');

    const result = page.locator('.tag-container .result-btn', { hasText: 'Entwicklerteam' });
    await expect(result).toBeVisible();
    await result.click();

    await expect(page).toHaveURL(new RegExp(`/main/channel/${seed.channels.secondChannelId}`));
  });
});
