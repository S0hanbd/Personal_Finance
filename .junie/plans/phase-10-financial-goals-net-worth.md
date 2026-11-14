# Requirements

### Overview & Goals
**Phase 10 — Transaction Editing, Profile Management & Dashboard Settings**: Enhance existing features with transaction editing (24-hour window), a complete profile management system, and user-customizable dashboard and navigation settings.

This phase addresses three gaps:
1. Users can create transactions but cannot edit them after creation.
2. The profile system is minimal (username + email only) with no personal info, avatar, or password change.
3. The dashboard and sidebar are hardcoded with no user customization.

### Scope

**In Scope:**
- **Transaction Editing with 24-hour window** — Edit or delete transactions only within 24 hours of creation. Add edit UI to TransactionsPage with an "Edit Transaction" modal.
- **Profile Management** — User profile with first name, last name, phone, bio, profile picture upload, and password change. Backend Profile model extension and frontend Profile settings tab.
- **Dashboard Customization** — Users can toggle which SummaryCards appear on the dashboard (Total Balance, Monthly Income, Monthly Expenses, etc.).
- **Navigation Customization** — Users can reorder and hide sidebar navigation items.
- **Settings Page** — Full SettingsPage with Profile, Dashboard, and Navigation tabs.

**Out of Scope:**
- Two-factor authentication (2FA).
- Social login (Google, GitHub, etc.).
- Theme customization (dark/light mode toggle).
- Email notifications.
- Multi-currency support.

### User Stories
1. As a user, I want to edit a transaction I just created so I can fix mistakes within the same day.
2. As a user, I want to update my profile (name, photo, bio) so my account feels personal.
3. As a user, I want to change my password so I can maintain account security.
4. As a user, I want to choose which cards appear on my dashboard so I see only what matters.
5. As a user, I want to hide navigation items I don't use so the sidebar is cleaner.

### Functional Requirements

**Transaction Editing:**
- Backend: Add 24-hour edit window check in `update_transaction()` and `delete_transaction()` services. Reject edits/deletes older than 24 hours with a clear error message.
- Frontend: Add "Edit" button on each transaction row in TransactionsPage. Edit modal pre-populated with current values. Delete confirmation dialog.
- The 24-hour window is calculated from `created_at` timestamp (from TimeStampedModel).

**Profile Management:**
- Backend: Extend User model with `first_name`, `last_name`, `phone`, `bio`, `profile_picture` (ImageField). Add password change endpoint.
- Frontend: Profile tab in SettingsPage with form for all fields, avatar preview, and password change form with current/new/confirm fields.
- Profile picture stored via Django's media files (local dev) with proper validation.

**Dashboard Customization:**
- Backend: `UserSettings` model with JSONField storing `dashboard_cards` (array of card IDs) and `sidebar_items` (array of nav item IDs with order).
- Frontend: Dashboard settings tab with toggles for each card. DashboardPage reads settings to conditionally render cards.

**Navigation Customization:**
- Backend: Same `UserSettings` model stores `sidebar_items` as ordered list.
- Frontend: Navigation settings tab with drag-to-reorder (simple up/down buttons) and visibility toggles. Sidebar reads settings to filter and order nav items.

### Non-Functional Requirements
- Backend: `python manage.py check`, `ruff check .`, `pytest` pass.
- Frontend: `pnpm typecheck`, `pnpm lint` pass.
- Settings should load within 200ms (cached in Zustand store).
- Profile picture upload limited to 5MB, JPEG/PNG only.
- All money values use `DecimalField` (backend) and `decimal.js` (frontend).

# Technical Design

### Current Implementation

**Transaction Editing:**
- `transactions/services.py`: `update_transaction()` and `delete_transaction()` exist with no time restrictions.
- `transactions/views.py`: `TransactionViewSet` has `update` and `destroy` methods.
- Frontend: `useDeleteTransaction` hook exists but is not used in TransactionsPage. No `useUpdateTransaction` hook. No edit UI.

**Profile:**
- `authentication/models.py`: User extends AbstractUser with only `timezone` and `default_currency`.
- `authentication/views.py`: `me_view` supports GET and PATCH but only for username, email, timezone, currency.
- `authentication/serializers.py`: `UserSerializer` exposes id, username, email, timezone, default_currency.
- Frontend: `useAuth.ts` has auth mutations but no profile update hook.

**Settings:**
- `SettingsPage.tsx`: Placeholder only, shows "coming in Phase 8" message.
- No UserSettings model exists.
- Dashboard cards and sidebar items are hardcoded.

**Dashboard:**
- `DashboardPage.tsx`: 7 SummaryCards (Total Balance, Monthly Income, Monthly Expenses, Unpaid Bills, Remaining After Bills, Future Obligations, Budget Remaining).
- `Sidebar.tsx`: 11 nav items hardcoded in `navItems` array.

### Key Decisions

**Transaction 24-hour window:**
- Enforce in the service layer (`transactions/services.py`) by comparing `timezone.now() - tx.created_at` against `timedelta(hours=24)`.
- Return a clear error: "This transaction can no longer be edited (24-hour window has passed)."
- This keeps the rule server-side and prevents API abuse.

**Profile picture storage:**
- Use Django's `ImageField` with `upload_to='profile_pictures/'`.
- No external storage (S3) — keeps it simple for local development.
- Frontend sends `FormData` for profile picture uploads.

**UserSettings model:**
- Single model with JSONField for flexibility. No separate models for dashboard and navigation settings.
- Default values provided so first-time users see all cards and nav items.
- Stored as `dashboard_cards` (string array) and `sidebar_items` (string array with order).

**Settings persistence:**
- Backend: REST API for CRUD on UserSettings.
- Frontend: Zustand store (`settingsStore.ts`) caches settings to avoid repeated API calls. React Query for mutations.

**Dashboard conditional rendering:**
- DashboardPage reads `dashboard_cards` from settings. Only renders SummaryCards whose IDs are in the list.
- Default: all 7 cards visible.

**Sidebar conditional rendering:**
- Sidebar reads `sidebar_items` from settings. Filters and orders nav items based on user preferences.
- Default: all 11 items visible in default order.

### Proposed Changes

**Backend (`apps/authentication/`):**
1. **Models** (`models.py`): Add `first_name`, `last_name`, `phone`, `bio`, `profile_picture` to User model. Create `UserSettings` model with `user` (OneToOne), `dashboard_cards` (JSONField), `sidebar_items` (JSONField).
2. **Serializers** (`serializers.py`): Add `ProfileSerializer` (all user fields), `PasswordChangeSerializer` (current_password, new_password1, new_password2), `UserSettingsSerializer`.
3. **Views** (`views.py`): Add `profile_view` (GET/PATCH for profile), `change_password_view` (POST), `user_settings_view` (GET/PATCH).
4. **URLs** (`urls.py`): Wire new endpoints.
5. **Services** (`services.py`): `update_profile()`, `change_password()`, `get_or_create_user_settings()`, `update_user_settings()`.

**Backend (`apps/transactions/services.py`):**
- Add 24-hour check to `update_transaction()` and `delete_transaction()`.

**Frontend:**
1. **Types** (`src/types/settings.ts`): `UserProfile`, `PasswordChange`, `UserSettings`, `DashboardCard`, `SidebarItem`.
2. **Types index** (`src/types/index.ts`): Export settings types.
3. **Hooks** (`src/hooks/useSettingsQueries.ts`): `useUserProfile()`, `useUpdateProfile()`, `useChangePassword()`, `useUserSettings()`, `useUpdateSettings()`.
4. **Hooks** (`src/hooks/useTransactions.ts`): Add `useUpdateTransaction()` mutation.
5. **Store** (`src/store/settingsStore.ts`): Zustand store for cached user settings.
6. **Components** (`src/components/settings/`):
   - `ProfileSettings.tsx`: Profile form with avatar upload, name, phone, bio fields.
   - `PasswordSettings.tsx`: Password change form.
   - `DashboardSettings.tsx`: Toggles for each dashboard card.
   - `NavigationSettings.tsx`: Toggles and reorder for sidebar items.
7. **Pages** (`src/pages/SettingsPage.tsx`): Full rewrite with tabs (Profile, Password, Dashboard, Navigation).
8. **Pages** (`src/pages/TransactionsPage.tsx`): Add edit button and edit modal to transaction rows.
9. **Components** (`src/components/layout/Sidebar.tsx`): Read from settings store to filter/order nav items.
10. **Pages** (`src/pages/DashboardPage.tsx`): Read from settings store to conditionally render cards.

### File Structure
```
backend/
  apps/authentication/
    models.py            (modified — add profile fields, UserSettings model)
    serializers.py       (modified — add ProfileSerializer, PasswordChangeSerializer, UserSettingsSerializer)
    views.py             (modified — add profile, password, settings endpoints)
    urls.py              (modified — wire new endpoints)
    services.py          (new — profile and settings services)
  apps/transactions/
    services.py          (modified — add 24-hour edit window)
  requirements.txt       (modified — add Pillow for image handling)

frontend/src/
  types/settings.ts      (new — UserProfile, UserSettings, etc.)
  types/index.ts         (modified — export settings types)
  hooks/useSettingsQueries.ts  (new — profile, password, settings hooks)
  hooks/useTransactions.ts     (modified — add useUpdateTransaction)
  store/settingsStore.ts       (new — Zustand settings cache)
  components/settings/
    ProfileSettings.tsx    (new — profile form with avatar)
    PasswordSettings.tsx   (new — password change form)
    DashboardSettings.tsx  (new — card toggles)
    NavigationSettings.tsx (new — nav item toggles and reorder)
  pages/SettingsPage.tsx (rewrite — tabbed settings page)
  pages/TransactionsPage.tsx (modified — add edit button and modal)
  components/layout/Sidebar.tsx (modified — read from settings)
  pages/DashboardPage.tsx (modified — conditional card rendering)
```

### Architecture Diagram

``` mermaid
graph LR
  subgraph Frontend
    SP[SettingsPage]
    PS[ProfileSettings]
    PW[PasswordSettings]
    DS[DashboardSettings]
    NS[NavigationSettings]
    SS[settingsStore]
    TP[TransactionsPage]
    EM[EditModal]
    SB[Sidebar]
    DP[DashboardPage]
  end

  subgraph Backend
    PV[profile_view]
    CV[change_password_view]
    SV[user_settings_view]
    TV[TransactionViewSet]
    TS[transactions/services]
  end

  SP --> PS
  SP --> PW
  SP --> DS
  SP --> NS
  PS --> PV
  PW --> CV
  DS --> SV
  NS --> SV
  SV --> SS
  TP --> EM
  EM --> TV
  TV --> TS
  SB --> SS
  DP --> SS
```