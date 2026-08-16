import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserListItemComponent } from './user-list-item.component';
import { makeUser } from '../../../../testing/user-fixtures';

describe('UserListItemComponent', () => {
  let component: UserListItemComponent;
  let fixture: ComponentFixture<UserListItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserListItemComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    fixture.componentRef.setInput('user', makeUser());
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders the user displayName', () => {
    fixture.componentRef.setInput('user', makeUser({ displayName: 'Alice' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Alice');
  });

  it('does not show the "(Du)" marker when currentUserId is unset', () => {
    fixture.componentRef.setInput('user', makeUser({ id: 'u1', displayName: 'Bob' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('(Du)');
  });

  it('does not show the "(Du)" marker when currentUserId does not match the user', () => {
    fixture.componentRef.setInput('user', makeUser({ id: 'u1', displayName: 'Bob' }));
    fixture.componentRef.setInput('currentUserId', 'u2');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('(Du)');
  });

  it('shows the "(Du)" marker when currentUserId matches the user id', () => {
    fixture.componentRef.setInput('user', makeUser({ id: 'u1', displayName: 'Bob' }));
    fixture.componentRef.setInput('currentUserId', 'u1');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('(Du)');
  });

  it('passes photoUrl and online through to the nested profile-status avatar', () => {
    fixture.componentRef.setInput('user', makeUser({ photoUrl: 'img/avatars/avatar_2.png', online: true }));
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('app-profile-status img.profile-status__image');
    expect(img.getAttribute('src')).toBe('img/avatars/avatar_2.png');
    const dot = fixture.nativeElement.querySelector('app-profile-status .profile-status__dot');
    expect(dot.classList.contains('profile-status__dot--online')).toBe(true);
  });

  it('reflects online=false on the nested profile-status avatar', () => {
    fixture.componentRef.setInput('user', makeUser({ online: false }));
    fixture.detectChanges();
    const dot = fixture.nativeElement.querySelector('app-profile-status .profile-status__dot');
    expect(dot.classList.contains('profile-status__dot--online')).toBe(false);
  });

  it('does not render the unread badge when unreadCount is 0 (default)', () => {
    fixture.componentRef.setInput('user', makeUser());
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-unread-badge .unread-badge')).toBeFalsy();
  });

  it('renders the unread badge with the given unreadCount', () => {
    fixture.componentRef.setInput('user', makeUser());
    fixture.componentRef.setInput('unreadCount', 7);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('app-unread-badge .unread-badge');
    expect(badge?.textContent.trim()).toBe('7');
  });
});
