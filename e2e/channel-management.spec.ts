import { test, expect } from './fixtures';

test.describe('Channel-Verwaltung', () => {
  test('Channel-Name und Beschreibung bearbeiten aktualisiert den Header live', async ({ loggedInPage: page }) => {
    await page.locator('.dropdown__list__btn', { hasText: 'Allgemein' }).click();

    // Opens EditChannelComponent (MatDialog, ariaLabel "Channel # Allgemein
    // bearbeiten"); the channel-name button has no accessible name of its
    // own beyond the live channel name + icon ligature text, so it's
    // targeted by its stable CSS class instead.
    await page.locator('.addChannel').click();
    const dialog = page.locator('.dialog-container');
    await expect(dialog).toBeVisible();

    const newName = `Allgemein-${Date.now()}`;
    const nameSection = dialog.locator('#channelname-edit-cont');
    await nameSection.locator('.save-btn').click(); // "Bearbeiten" -> reveals the input
    await dialog.getByLabel('Channelname').fill(newName);
    await nameSection.locator('.save-btn').click(); // "Speichern"
    await expect(nameSection).toContainText(newName);

    const newDescription = `Beschreibung ${Date.now()}`;
    const descriptionSection = dialog.locator('section.box', { hasText: 'Beschreibung' });
    await descriptionSection.locator('.save-btn').click();
    await dialog.getByLabel('Beschreibung').fill(newDescription);
    await descriptionSection.locator('.save-btn').click();
    await expect(descriptionSection).toContainText(newDescription);

    await dialog.locator('.channel-header').getByRole('button', { name: 'Schließen' }).click();
    await expect(dialog).toBeHidden();

    // The chat-channel header reads the same ChannelService.currentChannel
    // signal the dialog just wrote to, so it reflects the rename without a
    // reload.
    await expect(page.locator('.addChannel')).toContainText(newName);
  });

  test('Channel erstellen erscheint in der Sidebar (Mitgliederauswahl dedupliziert)', async ({ loggedInPage: page }) => {
    // Deliberately not navigating into a channel first: AddChannelComponent's
    // member suggestions run through the same ChannelService.filteredUsers
    // used by edit-channel, which excludes anyone already a member of
    // ChannelService.currentChannel() — if that were left pointing at
    // "Allgemein" (where Bob already is a member), Bob would never show up
    // as a selectable suggestion here. Starting from new-message/contactbar
    // keeps currentChannel() null.
    await page.getByRole('button', { name: 'Channel hinzufügen' }).first().click();

    const dialog = page.getByRole('dialog', { name: 'Channel erstellen' });
    await expect(dialog).toBeVisible();

    const createSection = dialog.locator('.add-channel-create');
    const channelName = `Testchannel-${Date.now()}`;
    await createSection.getByLabel('Channel-Name').fill(channelName);
    await createSection.getByRole('button', { name: 'Erstellen', exact: true }).click();

    // Second step: member selection. "Bestimmte Leute hinzufügen" is
    // selected by default (ChannelService.allMembersSelected starts false).
    // Selecting Bob removes him from the suggestion list (filteredUsers
    // excludes already-selected users), so this also confirms he ends up
    // as exactly one chip rather than being offered again afterwards.
    const memberSection = dialog.locator('.select-member-cont');
    await expect(memberSection.getByLabel('Bestimmte Leute hinzufügen')).toBeChecked();

    const bobSuggestion = memberSection.locator('.choose-user__bar__btn', { hasText: 'Bob Test' });
    await bobSuggestion.click();
    await expect(memberSection.locator('.choose-user__item', { hasText: 'Bob Test' })).toHaveCount(1);
    await expect(bobSuggestion).toHaveCount(0);

    await memberSection.getByRole('button', { name: 'Erstellen', exact: true }).click();
    await expect(dialog).toBeHidden();

    await expect(page.locator('.dropdown__list__btn', { hasText: channelName })).toBeVisible();
  });

  test('Mitglied hinzufügen bietet einen bereits vorhandenen Member kein zweites Mal an', async ({ loggedInPage: page }) => {
    // Alice and Bob are already both members of every seeded channel, so
    // this exercises the duplicate-prevention path directly: searching for
    // an existing member in "Mitglieder hinzufügen" must not offer them
    // again (ChannelService.filteredUsers excludes existing members),
    // which is what keeps the submit disabled instead of adding a dupe.
    await page.locator('.dropdown__list__btn', { hasText: 'Allgemein' }).click();
    await page.locator('.avatar-container').click();

    const dialog = page.getByRole('dialog', { name: 'Mitglieder hinzufügen' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.user__list__item', { hasText: 'Bob Test' })).toHaveCount(1);

    await dialog.locator('.add-member-btn').click();
    await dialog.getByLabel('Name eingeben').fill('Bob');

    await expect(dialog.locator('.user__list__btn', { hasText: 'Bob Test' })).toHaveCount(0);
    // .submit-btn is the <app-button> host; [disabled] only ever lands on
    // its inner native <button>, so assert through the accessible role.
    await expect(dialog.getByRole('button', { name: 'Hinzufügen' })).toBeDisabled();
  });
});
