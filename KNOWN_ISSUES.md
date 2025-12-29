# Known Issues

## 1. Duplicate Auth State Management

**Status:** Not fixed - causes infinite loops

**Current Behavior:**
`App.tsx` manages auth state locally with `useState` hooks (`isLoading`, `isAuthenticated`, `error`) instead of using the centralized `useAuth` hook.

**Why This Is a Problem:**
- Duplicated logic between `App.tsx` and `useAuth` hook
- Auth state exists in two places (local component state and Zustand store)
- Harder to maintain and reason about

**Attempted Fix:**
Refactored `App.tsx` to use the `useAuth` hook which manages state through the Zustand store.

**Why It Failed:**
React StrictMode double-invokes effects in development. The `useAuth` hook has an effect that calls `initialize()`, and when combined with how App.tsx renders, this creates an infinite loop. The `initialize` callback gets recreated due to its dependencies, triggering the effect repeatedly.

**Potential Solutions:**
1. Add a ref-based guard in `useAuth` to prevent double initialization (attempted, didn't fully work)
2. Move initialization out of the hook's effect and call it explicitly
3. Use a different state management pattern that's StrictMode-safe
4. Investigate if Zustand selector patterns could stabilize the callback dependencies

---

## 2. MSAL Cache Cannot Use sessionStorage

**Status:** Not fixed - causes redirect loops

**Current Behavior:**
MSAL is configured with `cacheLocation: 'localStorage'`.

**Why This Is a Problem:**
- `localStorage` persists across browser sessions, increasing token exposure window
- Tokens remain accessible even after browser is closed

**Attempted Fix:**
Changed MSAL config to `cacheLocation: 'sessionStorage'`.

**Why It Failed:**
MSAL uses the cache to persist auth state during OAuth redirects. When using `sessionStorage`, the auth state is lost during the redirect flow, causing infinite redirect loops.

**Workaround Applied:**
Custom token storage (separate from MSAL's cache) uses `sessionStorage` for our app-specific token data, while MSAL retains `localStorage` for its internal redirect handling.

---

## 3. DOMPurify Integration

**Status:** Not fixed - causes initialization issues

**Current Behavior:**
Using custom DOM-based HTML sanitization with `document.createElement()`.

**Why This Is a Problem:**
- Slight performance overhead from DOM operations
- Potential edge cases with script execution during parsing
- Won't work in non-browser environments (web workers, SSR)
- Not as battle-tested as DOMPurify

**Attempted Fix:**
Replaced custom sanitizer with DOMPurify library.

**Why It Failed:**
When DOMPurify was integrated, it caused initialization issues that resulted in infinite loops. The exact cause wasn't fully diagnosed before reverting.

**Potential Solutions:**
1. Investigate DOMPurify initialization timing
2. Lazy-load DOMPurify to avoid initialization conflicts
3. Check if DOMPurify hooks are interfering with React rendering

---

## 4. MSAL Popup COOP Warning

**Status:** Not fixed - cosmetic issue

**Current Behavior:**
Console shows: `Cross-Origin-Opener-Policy policy would block the window.closed call.`

**Why This Happens:**
Microsoft's login page sets `Cross-Origin-Opener-Policy` headers for security, which isolates the popup window from the parent. This prevents MSAL from polling `window.closed` to detect when the user closes the popup.

**Impact:**
Cosmetic only - the auth flow still completes successfully. MSAL's internal popup detection may be slightly less efficient.

**Potential Fixes:**
1. Switch from `loginPopup` to `loginRedirect` flow (changes UX)
2. Wait for MSAL library updates that handle COOP better
3. Configure server-side COOP headers (not applicable for external Microsoft login)

**Decision:** Leave as-is since it doesn't affect functionality.

---

## Notes

These issues were discovered during a security hardening effort. The following security improvements WERE successfully applied:

- Login rate limiting (3 attempts per 30 seconds)
- Log sanitization (redacts tokens, emails, sensitive fields)
- Custom token storage uses sessionStorage (not MSAL cache)
- Graph client race condition fix
- MSAL initialization race condition fix
- Input validation for Graph API IDs
- Visibility-based polling pause/resume
