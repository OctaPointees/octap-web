# Project Screens Implementation

This folder contains the screen implementations, separated by role and by purpose.

## Screen structure

Existing screens:

| Type    | Screen         | Directory                 | Audience                                                           |
| ------- | -------------- | ------------------------- | ------------------------------------------------------------------ |
| Role    | System Admin   | `@/screen/Administration` | Internal staff managing the system                                 |
| Role    | Business Owner | `@/screen/BusinessOwner`  | Business owners using the platform                                 |
| Role    | Business Dev   | `@/screen/BusinessDev`    | Developers associated with a business                              |
| Purpose | Authentication | `@/screen/Authentication` | Authentication screens (sign-in, sign-up, password recovery, etc.) |
| Purpose | Landing Page   | `@/screen/LandingPage`    | Landing page for OctaP                                             |

**Type:** `Role` screens are separated by user role; `Purpose` screens are separated by what they do and are not tied to a single role.

## Folder layout

Every screen follows the same folder layout so the codebase stays consistent and easy to navigate.

```txt
<ScreenName>/
  hooks/         # Hooks specific to this screen
  context/       # React context providers for this screen
  layout/        # Layout components for this screen
  components/    # Components specific to this screen
  README.md      # Short explanation, to-do list and disclaimers
  index.ts       # Entry point, default-exports the screen's root component
```

Directory names use PascalCase (e.g. `BusinessOwner`).

### Notes

- `<ScreenName>/components` is for components used **only** by that screen. Components shared across screens belong in `src/components`.
- Each screen's `index.ts` is the only thing the rest of the app should import from that screen.
- Each screen's `README.md` should state what the screen does, what's still to do, and any known limitations.

### Rules

- Screens must **not** import from each other. If two screens need the same code, move it to a shared location (e.g. `src/components`).
  - Example: route guards and session hooks needed by both `Authentication` and the role screens belong in a shared module such as `src/auth`, not inside `@/screen/Authentication`.
- Role-based UI is only for user experience. Access control must always be enforced by the backend API.
