# CODING STYLES & DISCLAIMERS

## Tailwind CSS v4

This project uses **Tailwind CSS v4**. Do not write v3-style code or rely on v3 habits. In particular, follow the rules below.

### Use theme tokens instead of `var(...)`

Avoid arbitrary values that wrap a CSS variable:

```html
<!-- Avoid -->
<div class="bg-[var(--ground)]"></div>

<!-- Preferred -->
<div class="bg-ground"></div>
```

For bg-ground to work, the variable must be registered in the theme with the matching namespace (--color-* for colors). All theme variables are defined in ./src/styles/theme.css

```css
@theme {
  --color-ground: oklch(0.98 0 0);
}
```

If the variable is defined elsewhere (e.g. in `:root` for light/dark theming), expose it with `@theme inline`:

```css
@theme inline {
  --color-ground: var(--ground);
}
```

Once registered, `ground` works with every color utility: `bg-ground`, `text-ground`, `border-ground`, and so on.

If a variable is not registered in the theme and you only need it once, use the v4 shorthand instead of `var(...)`: `bg-(--ground)`. Do not use `bg-[var(--ground)]`.

### Adding new theme variables

Define new design tokens (colors, spacing, radii, etc.) in `./src/styles/theme.css`, inside `@theme`. Do not define them in component files or inline styles.

```css
/* ./src/styles/theme.css */
@theme {
  --color-base-400: oklch(0.72 0.02 250);
}
```

Tailwind then generates the matching utilities automatically, e.g. `bg-base-400`, `text-base-400`, `border-base-400`.

Before adding a new variable, check that `theme.css` doesn't already have a similar one.

### Do not use fixed pixel values

Avoid arbitrary pixel values such as `p-[4px]` or `w-[200px]`. Use the spacing scale instead.

In v4, the spacing scale is dynamic: **1 unit = 0.25rem (4px at the default font size)**, and any number works, not only the traditional steps.

| Avoid        | Use      | Value  |
| ------------ | -------- | ------ |
| `p-[4px]`    | `p-1`    | 0.25rem (4px) |
| `p-[16px]`   | `p-4`    | 1rem (16px)   |
| `w-[200px]`  | `w-50`   | 12.5rem (200px) |
| `w-[384px]`  | `w-96`   | 24rem (384px)  |

Notes:

- Values are not interchangeable with pixels one-to-one. `p-4` is 16px, **not** 4px, and `w-96` is 384px, not 200px. Convert from the design value (`px / 4`) or pick the closest scale value that matches the design intent.
- If no scale value fits, prefer adding a token to `@theme` over an inline arbitrary value.
- Arbitrary values are acceptable only for genuine one-offs (e.g. a specific `grid-cols-[...]` template). Add a short comment explaining why.
