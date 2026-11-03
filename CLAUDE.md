# My Planner

A study planner for students, written as one vanilla JS file with no framework, build step or `package.json`. `PRD.md` covers what the product does and why; `README.md` is for end users.

## Layout

- `index.html`: the whole app. CSS, a small HTML shell, then one IIFE script that ends by calling `init()`.
- `sw.js`: service worker for push notifications only. It has no cache and no `fetch` handler, so the app has no offline mode and there are no cache versions to bump.
- `scripts/send-reminders.mjs`: server side of reminders. Reads Firestore, sends web push.
- `scripts/reminders-core.mjs`: decides which reminders are due. No network code.
- `.github/workflows/reminders.yml`: runs the send script every 10 minutes. Needs the `FIREBASE_SERVICE_ACCOUNT` and `VAPID_PRIVATE_KEY` secrets. If they're missing, the script logs and exits 0, so the failure is silent.
- `manifest-<icon>-<theme>.webmanifest` and `icons/`: one manifest per icon and theme pair, 4 icons (a, c, d, h) × 5 themes.

To find code in `index.html`, search for the function name: `render`, `renderSheet`, `renderToday`, `store`, `persist`, `loadPlanner`, `useData`, `todosFor`, `eventsOn`, `checkReminders`, `smartParse`, `localParse`.

## Running and checking changes

There are no tests, linter or build. Serve the folder with any static server and try the change in a browser, at both phone and desktop widths and in light and dark mode.

- The service worker and push register only on `https:`, so they can't be tested on `http://localhost`.
- The app talks to the live Firestore database even when run locally. Test with a throwaway planner, never a real one.
- The site appears to be served by GitHub Pages at https://evagabriellekrasner.github.io/My-Planner/. Assume a push to `main` reaches real users.

## Rules that are easy to break

**Rendering**
- Build all UI with `h(tag, attrs, ...kids)`. Never use `innerHTML`; user text stays safe because `h` uses text nodes.
- `h` details: `on*` keys become listeners, and `false`/`null` attributes are dropped. So ARIA values need `String(bool)`, boolean attributes use `x||null`, and a textarea's value is set through `.value`.
- `render()` rebuilds the DOM with `replaceChildren`. Keep in-progress text in `state` and give inputs stable ids, or they lose their value and focus.
- Modals live in `#modalRoot`, survive `render()`, and use their own local `draw()`.

**Data**
- The planner has no schema version. New fields need defaults merged in `useData` and `||[]` style guards, because old documents must keep loading.
- Normal saves must go through `persist()`, which overwrites only the `json` field (`?mask=json`). Writing the whole document erases `push` and `sent`. The passcode-change tombstone does this on purpose.
- Saves are last-write-wins across devices, with no sync or conflict handling.
- The document ID is a SHA-256 of the name and passcode, so changing how names are normalized or keys are built locks people out of their planners.
- Dates are local `YYYY-MM-DD` strings compared as text. Parse with the `parse` helper, never `new Date(str)`.

**Reminders**
- `eventsOn` and reminder timing exist in both `index.html` and `scripts/reminders-core.mjs`. Change both.
- The tags `ev:<id>:<date>` and `daily:<date>` must match on both sides, or devices show duplicates.

**Themes and icons**
- A new theme or icon needs new manifests and icon files, entries in `PALETTES`, `ICONS` and `THEME_HEX`, and CSS blocks for light and dark in both the media query and `data-theme` forms.
- The CSS "friendly redesign overrides" re-style earlier rules, so order matters.

## Wording

Users are students, so interface text is warm, plain and second person, with short sentences: "Nothing on your list". Avoid technical terms. Strings use curly apostrophes.

Commit messages follow the same plain style and describe what the user sees: "School days off: No school button on any day".

## Privacy

There are no real accounts: anyone with a name and 4-digit passcode can open that planner. Don't add features that encourage storing more personal information without raising this first. Firestore security rules aren't in this repo.

The Firebase web config and VAPID public key in source are public by design. Never commit the service account or VAPID private key.

## Leftover code

Some code is left from an earlier hosted platform and does nothing today: `refs`, `write`, `state.mode==='db'` branches, `readOnly` banners, the `if(false)` banner, `renderPalette`, `rotates`, `PRELOADED`, and `claudeParse`, which runs only if `window.claude` exists. Don't build on it. Remove it only when asked.
