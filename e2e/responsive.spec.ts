import { test, expect } from './fixtures';

/**
 * Only viewport-dependent assertions live here — every other spec already
 * runs against both the `desktop` and `mobile` Playwright projects, so
 * duplicating full flows here would just re-run the same thing twice under
 * a different name. This file covers the two places where the app's own
 * `window.innerWidth < 1024` branching (MainDefaultGuard, NavigationService,
 * MainChatComponent's template) makes desktop and mobile behave or render
 * structurally differently.
 */
test.describe('Responsives Verhalten', () => {
  test('Bare /main zeigt auf Mobile direkt die Kontaktliste (kein Redirect)', async ({ loggedInPage: page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'mobile-only: mainDefaultGuard only skips the redirect when isMobile is true');

    await page.goto('/main');
    await expect(page).toHaveURL(/\/main$/);
    await expect(page.locator('.dropdown__list__btn', { hasText: 'Allgemein' })).toBeVisible();
  });

  test('Bare /main redirectet auf Desktop zu /main/new-message', async ({ loggedInPage: page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop-only: mainDefaultGuard redirects via router.parseUrl on desktop');

    await page.goto('/main');
    await expect(page).toHaveURL(/\/main\/new-message/);
  });

  test('Contactbar bleibt auf Desktop als persistentes Seitenpanel sichtbar, während ein Channel offen ist', async ({
    loggedInPage: page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'desktop-only: contactbar lives in an always-rendered mat-drawer mode="side" next to the router-outlet',
    );

    await page.locator('.dropdown__list__btn', { hasText: 'Allgemein' }).click();
    await expect(page).toHaveURL(/\/main\/channel\//);

    // Both the sidebar entry and the routed channel content are visible
    // side-by-side — the drawer never gets swapped out for the route.
    await expect(page.locator('.dropdown__list__btn', { hasText: 'Allgemein' })).toBeVisible();
    await expect(page.locator('textarea[role="combobox"]').first()).toBeVisible();
  });

  test('Contactbar wird auf Mobile durch die Channel-Ansicht ersetzt statt als Panel zu bleiben', async ({
    loggedInPage: page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile',
      'mobile-only: MainChatComponent only renders app-contactbar while isMainChat() is true, swapping it for router-outlet otherwise',
    );

    await page.locator('.dropdown__list__btn', { hasText: 'Allgemein' }).click();
    await expect(page).toHaveURL(/\/main\/channel\//);

    // Unlike desktop, the contactbar isn't a side panel here — navigating
    // into a channel removes it from the DOM entirely.
    await expect(page.locator('.dropdown__list__btn', { hasText: 'Allgemein' })).toHaveCount(0);
    await expect(page.locator('textarea[role="combobox"]').first()).toBeVisible();
  });

  test('Workspacemenü-Toggle öffnet/schließt die Contactbar-Drawer auf Desktop', async ({ loggedInPage: page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop-only: the collapsible mat-drawer toggle button only renders when !isMobile');

    // mat-drawer stays translated on/off-canvas rather than toggling
    // display/visibility, so Playwright's toBeVisible()/toBeHidden() can't
    // reliably tell the states apart — asserting the CDK's own
    // mat-drawer-opened class is the meaningful, non-flaky check here.
    const drawer = page.locator('.contactbar-container');
    const toggle = page.locator('.navbar-toggle-btn');

    await expect(drawer).toHaveClass(/mat-drawer-opened/);
    await toggle.click();
    await expect(drawer).not.toHaveClass(/mat-drawer-opened/);
    await toggle.click();
    await expect(drawer).toHaveClass(/mat-drawer-opened/);
  });
});
