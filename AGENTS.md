# AGENTS.md — Booksgalore

This file provides full context for any AI coding agent working on this project. Read it entirely before making any changes.

---

## Project Summary

**Name:** Booksgalore
**Tagline:** "Treat your shelf!"
**Author:** WolfySaurian Studios

Booksgalore is a web app where users search for books or authors, view results in a card grid, and save books to a personal reading list. The reading list is stored in Firebase Firestore and persists across sessions. Each saved book can be toggled between "Want to Read" and "Read".

---

## File Structure

```
booksgalore/
├── index.html      # App shell and all markup
├── style.css       # All styling, CSS variables, layout
└── app.js          # All logic: search, Firebase, UI interactions
```

All three files must remain separate. Do not consolidate them into one file. Do not introduce a build system, bundler, or package manager. The app must run as plain static files, deployable directly to GitHub Pages.

---

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Database:** Firebase Firestore (loaded via CDN)
- **External API:** OpenLibrary Search API
- **Hosting:** GitHub Pages

No frameworks. No npm. No build steps. CDN links only.

---

## OpenLibrary API

**Search:**
```
GET https://openlibrary.org/search.json?q={QUERY}&fields=key,title,author_name,cover_i,first_publish_year,edition_count&limit=10
```

**Cover image:**
```
https://covers.openlibrary.org/b/id/{cover_i}-M.jpg
```

- Always include the `fields` parameter explicitly — do not rely on default field behaviour.
- If `cover_i` is missing, display a fallback placeholder (warm parchment colour with a book icon).
- Rate limit: 1 request/second. Do not implement polling or auto-search-on-type without debouncing.

---

## Firebase

- Firebase is loaded via CDN in `index.html`.
- There is a clearly marked placeholder block in `app.js` for the Firebase config object. Do not hardcode any real credentials. Do not remove the placeholder.
- Firestore is the only Firebase service used. Do not add Authentication, Storage, or any other Firebase services unless explicitly instructed.
- Each saved book is stored as a document in a `reading-list` collection with the following fields:
  - `key` — OpenLibrary work key (used as document ID)
  - `title` — string
  - `author_name` — array of strings
  - `cover_i` — number or null
  - `first_publish_year` — number or null
  - `status` — string, either `"want-to-read"` or `"read"`
  - `savedAt` — Firestore server timestamp

---

## Layout & Navigation

The app has two views:

1. **Search view** — default view on load, shows search results
2. **Bookshelf view** — shows the user's saved reading list

A persistent **"Your Bookshelf"** button is always visible in the top left. It is styled like a bookmark or worn label. Clicking it switches to the Bookshelf view from anywhere in the app.

---

## Search Bar

- Located in the **top right corner**.
- Styled to resemble the **spine of a book** when collapsed:
  - Tall and narrow
  - Placeholder text rotated 90 degrees
  - Subtle spine texture via CSS
- On click or focus, it **expands horizontally** into a full input field with a smooth CSS transition.
- Uses a terracotta focus ring (`#C4622D`).
- Font: Playfair Display.

---

## Filter Sidebar

- Located on the **left side** of the screen.
- Toggled by a menu icon (stacked lines or stacked book spines).
- **Desktop:** slides in and gently nudges the main content area.
- **Mobile:** overlays the content (does not push it).
- Smooth open/close CSS transition.

Filter options:
| Filter | Type | Options |
|---|---|---|
| Sort by | Dropdown | Relevance, Year (Newest), Year (Oldest) |
| Publication era | Radio/Select | Any, Classic (pre-1950), Modern (1950–2000), Contemporary (2000+) |
| Has cover image | Toggle | On / Off |
| Minimum editions | Dropdown | Any, 2+, 5+, 10+ |

Filters are applied client-side to the current result set. They do not trigger a new API call.

---

## Book Cards

Each card in the search results grid displays:
- Book cover image (top, full card width)
- Title (bold, Playfair Display)
- Author name(s) (muted colour, Lato)
- First publish year (muted, small)
- A **Save** button at the bottom (terracotta, rounded)

Clicking anywhere on the card (except the Save button) opens a **detail modal** with full book info.

If a book is already saved, the Save button changes to show its current status and allows toggling.

---

## Book Detail Modal

Opens on card click. Contains:
- Large cover image
- Title, author(s), year, edition count
- Status toggle (if saved): "Want to Read" ↔ "Read"
- Save / Remove button
- Close button or click-outside-to-dismiss

Appears with a fade-in animation. Background overlay: `rgba(0,0,0,0.45)`.

---

## Reading List (Bookshelf View)

- Same card grid layout as search results.
- Each card shows a **status badge**: Amber (`#E8A838`) for "Want to Read", Terracotta (`#C4622D`) for "Read".
- Cards include a toggle button to switch status and a remove button.
- If the list is empty, show a warm, friendly empty state message.

---

## Design System

### Colours (CSS variables — define in `:root` in `style.css`)

```css
--color-bg: #FDF6EE;
--color-surface: #FFF8F2;
--color-primary: #C4622D;
--color-primary-hover: #A84E22;
--color-secondary: #E8A838;
--color-text: #2E1F0F;
--color-text-muted: #7A5C42;
--color-border: #E2D0BC;
--color-overlay: rgba(0, 0, 0, 0.45);
```

### Typography

```css
--font-heading: 'Playfair Display', serif;
--font-body: 'Lato', sans-serif;
```

Load both from Google Fonts in `index.html`.

Font scale: `12px / 14px / 16px / 20px / 28px / 36px`

### Spacing

Base-8 scale: `4px, 8px, 16px, 24px, 32px, 48px, 64px`

### Cards

- Border radius: `12px`
- Soft box shadow
- Lifts slightly on hover (`transform: translateY(-4px)`)

### Buttons

- Primary: filled terracotta, rounded, Lato font
- Secondary: outlined, terracotta border
- All buttons have clear hover and focus states

---

## Behaviour Rules

- The app must work with no backend other than Firebase Firestore.
- All Firebase config values must remain as a placeholder — never hardcoded.
- Do not add any features not described in this file unless explicitly asked.
- Do not change the colour tokens or font choices unless explicitly asked.
- Do not merge the three files (`index.html`, `style.css`, `app.js`) under any circumstances.
- Always handle missing data gracefully: missing covers, missing authors, missing years.
- The app must be fully functional on both mobile and desktop.

---

## Agent Behaviour

- Read this entire file before making any edits.
- Make the smallest change that satisfies the instruction.
- Do not refactor or reorganise code that is not related to the current task.
- Leave the Firebase config placeholder exactly as-is unless instructed to update it.
- If something is ambiguous, implement the most conservative interpretation and leave a comment in the code flagging the decision.
