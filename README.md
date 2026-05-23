# 📚 Booksgalore
### *"Treat your shelf!"*

> By **WolfySaurian Studios**

Booksgalore is a warm, cosy web app that lets anyone search for books or authors and save them to a personal reading list that persists across sessions. Think of it as your own little digital bookshelf — always there, always welcoming.

---

## ✨ Features

- **Search** for any book title or author via the OpenLibrary API
- **Browse results** in a card grid with cover images, titles, authors, and publish years
- **Click any card** to view full book details in a modal
- **Save books** to your personal reading list
- **Toggle status** between *Want to Read* and *Read*
- **Persistent bookshelf** — your list is saved to Firebase Firestore and survives page refreshes
- **Filter sidebar** to narrow results by era, cover availability, and more
- **Immersive book-spine search bar** in the top right corner
- **Collapsible filter menu** on the left side

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Database | Firebase Firestore |
| External API | OpenLibrary (free, no API key needed) |
| Hosting | GitHub Pages |

---

## 📁 File Structure

```
booksgalore/
├── index.html      # App shell and markup
├── style.css       # All styling and design tokens
└── app.js          # Logic, API calls, Firebase integration
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/booksgalore.git
cd booksgalore
```

### 2. Set up Firebase

This project uses Firebase Firestore for persistent storage. Follow your Firebase setup guide to create a project and obtain your config object, then paste it into the clearly marked placeholder inside `app.js`.

### 3. Deploy to GitHub Pages

Push your code to a GitHub repository and enable GitHub Pages from the repository settings, pointing to the `main` branch and root folder. Your app will be live at:

```
https://YOUR_USERNAME.github.io/booksgalore
```

---

## 🎨 Design System at a Glance

Booksgalore uses a warm, library-inspired visual identity:

- **Fonts:** Playfair Display (headings) + Lato (body) via Google Fonts
- **Colours:** Terracotta (`#C4622D`), Amber (`#E8A838`), Parchment background (`#FDF6EE`)
- **Cards:** Rounded, softly shadowed, lift on hover
- **Layout:** Mobile-first, responsive grid (1 column → 3–4 columns on desktop)
- **Status badges:** Amber for *Want to Read*, Terracotta for *Read*

---

## 🔌 API Reference

Booksgalore uses the **OpenLibrary Search API** — free, no authentication required.

**Search endpoint:**
```
https://openlibrary.org/search.json?q=QUERY&fields=key,title,author_name,cover_i,first_publish_year&limit=10
```

**Cover images:**
```
https://covers.openlibrary.org/b/id/{cover_i}-M.jpg
```

> **Note:** As of January 2025, OpenLibrary returns a reduced set of fields by default. The `fields` parameter is always specified explicitly in this app. Rate limit is 1 request/second without a `User-Agent` header, 3/second with one.

---

## 📄 Licence

This project is open for personal and educational use. Please credit **WolfySaurian Studios** if you build on it.
