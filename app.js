import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js';

const searchBar = document.getElementById('search-bar');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const resultsGrid = document.getElementById('results-grid');
const emptyState = document.getElementById('empty-state');
const emptyStateCopy = document.getElementById('empty-state-copy');
const emptyStateClose = document.getElementById('empty-state-close');
const viewHeading = document.getElementById('view-heading');
const viewSubtitle = document.getElementById('view-subtitle');
const sortBy = document.getElementById('sort-by');
const publicationEra = document.getElementById('publication-era');
const hasCoverToggle = document.getElementById('has-cover');
const minimumEditions = document.getElementById('minimum-editions');
const bookshelfToggle = document.getElementById('bookshelf-toggle');
const filterToggle = document.getElementById('filter-toggle');
const filterSidebar = document.getElementById('filter-sidebar');
const filterClose = document.getElementById('filter-close');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
const modalContent = document.getElementById('modal-content');

const firebaseConfig = {
  apiKey: 'AIzaSyC-MmuTZSe1uNNvW-3YSMBl7jfzAfBvDgE',
  authDomain: 'booksgalore-1413.firebaseapp.com',
  projectId: 'booksgalore-1413',
  storageBucket: 'booksgalore-1413.firebasestorage.app',
  messagingSenderId: '817700718822',
  appId: '1:817700718822:web:4d393a6b0fc776b5649327'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const state = {
  currentView: 'search',
  searchQuery: '',
  results: [],
  savedBooks: {},
  currentBook: null,
  searchTimer: null,
  isLoading: false,
  authReadyPromise: null,
  firebaseAvailable: true
};

async function ensureAuth() {
  if (!state.authReadyPromise) {
    state.authReadyPromise = signInAnonymously(auth)
      .then(() => true)
      .catch((error) => {
        // If anonymous auth isn't configured in the Firebase project
        // disable persistence features and allow the app to continue.
        const code = error && error.code ? error.code : '';
        const msg = error && error.message ? error.message : '';
        if (code === 'auth/configuration-not-found' || msg.includes('configuration-not-found') || msg.includes('404') || msg.includes('400')) {
          console.warn('Firebase anonymous auth not available; persistence disabled.', error);
          state.firebaseAvailable = false;
          return true;
        }

        state.authReadyPromise = null;
        throw error;
      });
  }

  await state.authReadyPromise;
}

function toggleSidebar(forceOpen) {
  const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !filterSidebar.classList.contains('open');
  filterSidebar.classList.toggle('open', shouldOpen);
  sidebarOverlay.classList.toggle('visible', shouldOpen);
  document.body.classList.toggle('sidebar-open', shouldOpen);
  filterToggle.setAttribute('aria-expanded', String(shouldOpen));
}

function showEmptyState(message) {
  emptyState.hidden = false;
  emptyStateCopy.textContent = message;
  resultsGrid.innerHTML = '';
}

function hideEmptyState() {
  emptyState.hidden = true;
}

function getFirebaseNotice() {
  if (state.firebaseAvailable) {
    return '';
  }

  if (state.currentView === 'search' && state.searchQuery.trim()) {
    return 'Firebase persistence is unavailable; your search works, but saved books cannot be stored until Firebase is configured.';
  }

  if (state.currentView === 'bookshelf') {
    return 'Firebase persistence is unavailable; your bookshelf cannot be loaded until Firebase is configured.';
  }

  return '';
}

function dismissEmptyState() {
  hideEmptyState();

  if (state.currentView !== 'bookshelf') {
    renderResults();
  }
}

function normalizeBook(doc) {
  const authors = Array.isArray(doc.author_name) ? doc.author_name.filter(Boolean) : [];
  const editionCount = typeof doc.edition_count === 'number' ? doc.edition_count : null;
  return {
    key: doc.key || '',
    title: doc.title || 'Untitled book',
    author_name: authors.length ? authors : ['Unknown author'],
    cover_i: doc.cover_i ?? null,
    first_publish_year: typeof doc.first_publish_year === 'number' ? doc.first_publish_year : null,
    edition_count: editionCount,
    status: 'want-to-read'
  };
}

function getStatusLabel(status) {
  return status === 'read' ? 'Read' : 'Want to Read';
}

function getStatusClass(status) {
  return status === 'read' ? 'status-badge--read' : 'status-badge--want';
}

function getCoverMarkup(book) {
  if (book.cover_i) {
    return `<img class="book-cover" src="https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg" alt="Cover for ${book.title}" onerror="this.style.display='none'; this.nextElementSibling.hidden = false;" />` +
      `<div class="book-cover book-cover--placeholder" hidden aria-hidden="true">📖</div>`;
  }

  return `<div class="book-cover book-cover--placeholder" aria-hidden="true">📖</div>`;
}

function getSavedBook(book) {
  return state.savedBooks[book.key] || null;
}

function renderResults() {
  const filtered = applyFilters(state.results);

  resultsGrid.innerHTML = '';

  if (!state.searchQuery.trim()) {
    viewHeading.textContent = 'Search results';
    viewSubtitle.textContent = 'Search for a title or author to browse the collection.';
    showEmptyState('Start by searching — use the search bar to find books by title or author.');
    return;
  }

  if (!filtered.length) {
    viewHeading.textContent = 'No results matched';
    viewSubtitle.textContent = 'Try adjusting your filters or search terms.';
    showEmptyState('No books matched your current search and filters.');
    return;
  }

  hideEmptyState();
  viewHeading.textContent = state.currentView === 'bookshelf' ? 'Your bookshelf' : 'Search results';
  viewSubtitle.textContent = state.currentView === 'bookshelf'
    ? 'Your saved books are waiting for you below.'
    : `Showing ${filtered.length} result${filtered.length === 1 ? '' : 's'} for “${state.searchQuery}”.`;

  const firebaseNotice = getFirebaseNotice();
  if (firebaseNotice) {
    viewSubtitle.textContent += ' ' + firebaseNotice;
  }

  filtered.forEach((book) => {
    const savedBook = getSavedBook(book);
    const status = savedBook ? savedBook.status : 'want-to-read';
    const buttonText = savedBook ? getStatusLabel(status) : 'Save';

    const article = document.createElement('article');
    article.className = 'book-card';
    article.innerHTML = `
      ${getCoverMarkup(book)}
      <div>
        ${savedBook ? `<span class="status-badge ${getStatusClass(status)}">${getStatusLabel(status)}</span>` : ''}
        <h3>${book.title}</h3>
        <p class="book-meta">${book.author_name.join(', ')}</p>
        <p class="book-description">${book.first_publish_year || 'Year unknown'}</p>
      </div>
      <div class="card-actions">
        <button class="primary-btn" type="button" data-action="toggle-save" data-key="${book.key}">${buttonText}</button>
        ${savedBook ? `<button class="secondary-btn" type="button" data-action="open-modal" data-key="${book.key}">View</button>` : '<button class="secondary-btn" type="button" data-action="open-modal" data-key="'+book.key+'">Details</button>'}
      </div>`;

    article.addEventListener('click', (event) => {
      const target = event.target.closest('[data-action]');
      if (!target) {
        openModal(book);
        return;
      }

      if (target.dataset.action === 'open-modal') {
        openModal(book);
      }

      if (target.dataset.action === 'toggle-save') {
        event.preventDefault();
        event.stopPropagation();
        if (savedBook) {
          toggleStatus(book.key, status === 'read' ? 'want-to-read' : 'read');
        } else {
          saveBook(book);
        }
      }
    });

    resultsGrid.appendChild(article);
  });
}

function renderBookshelf() {
  state.currentView = 'bookshelf';
  const savedEntries = Object.values(state.savedBooks);
  viewHeading.textContent = 'Your bookshelf';
  viewSubtitle.textContent = savedEntries.length
    ? 'Your saved books are waiting for you below.'
    : 'Your bookshelf is empty. Save a book to start building your personal list.';

  const firebaseNotice = getFirebaseNotice();
  if (firebaseNotice) {
    viewSubtitle.textContent += ' ' + firebaseNotice;
  }

  resultsGrid.innerHTML = '';

  if (!savedEntries.length) {
    showEmptyState('Your bookshelf is empty. Save a book to start building your personal list.');
    return;
  }

  hideEmptyState();

  savedEntries.forEach((book) => {
    const article = document.createElement('article');
    article.className = 'book-card';
    article.innerHTML = `
      ${getCoverMarkup(book)}
      <div>
        <span class="status-badge ${getStatusClass(book.status)}">${getStatusLabel(book.status)}</span>
        <h3>${book.title}</h3>
        <p class="book-meta">${book.author_name.join(', ')}</p>
        <p class="book-description">${book.first_publish_year || 'Year unknown'}</p>
      </div>
      <div class="card-actions">
        <button class="toggle-btn" type="button" data-action="toggle-status" data-key="${book.key}">${book.status === 'read' ? 'Mark Want to Read' : 'Mark Read'}</button>
        <button class="remove-btn" type="button" data-action="remove-book" data-key="${book.key}">Remove</button>
      </div>`;

    article.addEventListener('click', (event) => {
      const target = event.target.closest('[data-action]');
      if (!target) {
        openModal(book);
        return;
      }

      event.stopPropagation();
      if (target.dataset.action === 'toggle-status') {
        toggleStatus(book.key, book.status === 'read' ? 'want-to-read' : 'read');
      }

      if (target.dataset.action === 'remove-book') {
        removeBook(book.key);
      }
    });

    resultsGrid.appendChild(article);
  });
}

function renderSearchView() {
  state.currentView = 'search';
  if (!state.searchQuery.trim()) {
    renderResults();
    return;
  }
  renderResults();
}

function applyFilters(books) {
  let filtered = [...books];

  if (sortBy.value === 'year-desc') {
    filtered.sort((a, b) => (b.first_publish_year || 0) - (a.first_publish_year || 0));
  }

  if (sortBy.value === 'year-asc') {
    filtered.sort((a, b) => (a.first_publish_year || 0) - (b.first_publish_year || 0));
  }

  if (publicationEra.value === 'classic') {
    filtered = filtered.filter((book) => (book.first_publish_year || 0) < 1950);
  }

  if (publicationEra.value === 'modern') {
    filtered = filtered.filter((book) => (book.first_publish_year || 0) >= 1950 && (book.first_publish_year || 0) <= 2000);
  }

  if (publicationEra.value === 'contemporary') {
    filtered = filtered.filter((book) => (book.first_publish_year || 0) >= 2000);
  }

  if (hasCoverToggle.checked) {
    filtered = filtered.filter((book) => Boolean(book.cover_i));
  }

  if (minimumEditions.value !== 'any') {
    const minimum = Number(minimumEditions.value);
    filtered = filtered.filter((book) => (book.edition_count ?? 0) >= minimum);
  }

  return filtered;
}

async function fetchResults(query) {
  if (!query.trim()) {
    state.results = [];
    renderResults();
    return;
  }

  state.isLoading = true;
  try {
    const url = new URL('https://openlibrary.org/search.json');
    url.searchParams.set('q', query);
    url.searchParams.set('fields', 'key,title,author_name,cover_i,first_publish_year,edition_count');
    url.searchParams.set('limit', '10');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('OpenLibrary request failed.');
    }

    const payload = await response.json();
    state.results = (payload.docs || []).map(normalizeBook);
    renderResults();
  } catch (error) {
    console.error(error);
    showEmptyState('We could not load search results right now. Please try again.');
  } finally {
    state.isLoading = false;
  }
}

async function loadSavedBooks() {
  if (!state.firebaseAvailable) {
    state.savedBooks = {};
    if (state.currentView === 'bookshelf') {
      renderBookshelf();
    } else {
      renderResults();
    }
    return;
  }

  try {
    await ensureAuth();
    const snapshot = await getDocs(collection(db, 'reading-list'));
    state.savedBooks = {};

    snapshot.forEach((savedDoc) => {
      const data = savedDoc.data();
      state.savedBooks[savedDoc.id] = {
        key: data.key,
        title: data.title,
        author_name: data.author_name || ['Unknown author'],
        cover_i: data.cover_i ?? null,
        first_publish_year: data.first_publish_year ?? null,
        edition_count: data.edition_count ?? null,
        status: data.status || 'want-to-read'
      };
    });

    if (state.currentView === 'bookshelf') {
      renderBookshelf();
    } else {
      renderResults();
    }
  } catch (error) {
    console.error(error);
    showEmptyState('Your bookshelf could not be loaded. Please try again.');
  }
}

async function saveBook(book) {
  if (!state.firebaseAvailable) {
    console.warn('Firebase persistence unavailable; save skipped.');
    renderResults();
    return;
  }
  const payload = {
    key: book.key,
    title: book.title,
    author_name: book.author_name,
    cover_i: book.cover_i ?? null,
    first_publish_year: book.first_publish_year ?? null,
    edition_count: book.edition_count ?? null,
    status: 'want-to-read',
    savedAt: serverTimestamp()
  };

  try {
    await ensureAuth();
    await setDoc(doc(db, 'reading-list', book.key), payload);
    state.savedBooks[book.key] = payload;
    renderResults();
  } catch (error) {
    console.error(error);
    showEmptyState('Could not save this book. Please try again.');
  }
}

async function removeBook(key) {
  if (!state.firebaseAvailable) {
    console.warn('Firebase persistence unavailable; remove skipped.');
    if (state.currentView === 'bookshelf') {
      renderBookshelf();
    } else {
      renderResults();
    }
    return;
  }
  try {
    await ensureAuth();
    await deleteDoc(doc(db, 'reading-list', key));
    delete state.savedBooks[key];

    if (state.currentView === 'bookshelf') {
      renderBookshelf();
    } else {
      renderResults();
    }

    if (state.currentBook && state.currentBook.key === key) {
      closeModal();
    }
  } catch (error) {
    console.error(error);
    showEmptyState('Could not remove this book. Please try again.');
  }
}

async function toggleStatus(key, status) {
  if (!state.firebaseAvailable) {
    console.warn('Firebase persistence unavailable; status update skipped.');
    if (state.currentView === 'bookshelf') {
      renderBookshelf();
    } else {
      renderResults();
    }
    return;
  }
  try {
    await ensureAuth();
    await updateDoc(doc(db, 'reading-list', key), { status });
    state.savedBooks[key].status = status;

    if (state.currentBook && state.currentBook.key === key) {
      state.currentBook = { ...state.currentBook, status };
      renderModal();
    }

    if (state.currentView === 'bookshelf') {
      renderBookshelf();
    } else {
      renderResults();
    }
  } catch (error) {
    console.error(error);
    showEmptyState('Could not update this book status. Please try again.');
  }
}

function openModal(book) {
  state.currentBook = book;
  modalOverlay.hidden = false;
  renderModal();
}

function closeModal() {
  modalOverlay.hidden = true;
  state.currentBook = null;
}

function renderModal() {
  if (!state.currentBook) {
    modalContent.innerHTML = '';
    return;
  }

  const savedBook = getSavedBook(state.currentBook);
  const status = savedBook ? savedBook.status : 'want-to-read';
  const currentBook = savedBook ? { ...state.currentBook, status } : state.currentBook;

  modalContent.innerHTML = `
    <div>
      ${getCoverMarkup(currentBook)}
    </div>
    <div>
      <p class="eyebrow">Book details</p>
      <h2 id="modal-title" class="modal-title">${currentBook.title}</h2>
      <p class="modal-meta">${currentBook.author_name.join(', ')}</p>
      <p class="modal-meta">First published: ${currentBook.first_publish_year || 'Unknown year'}</p>
      <p class="modal-meta">Editions: ${currentBook.edition_count ?? 'Unknown'}</p>
      <p class="modal-description">Search results are sourced from OpenLibrary. Save this title to keep it in your personal bookshelf.</p>
      ${savedBook ? `<p class="status-badge ${getStatusClass(status)}">${getStatusLabel(status)}</p>` : ''}
      <div class="card-actions">
        ${savedBook ? `<button class="toggle-btn" type="button" id="modal-toggle-status">${status === 'read' ? 'Mark Want to Read' : 'Mark Read'}</button>` : `<button class="primary-btn" type="button" id="modal-save">Save</button>`}
        ${savedBook ? `<button class="remove-btn" type="button" id="modal-remove">Remove</button>` : ''}
      </div>
    </div>`;

  const toggleButton = document.getElementById('modal-toggle-status');
  const saveButton = document.getElementById('modal-save');
  const removeButton = document.getElementById('modal-remove');

  if (toggleButton) {
    toggleButton.addEventListener('click', () => toggleStatus(currentBook.key, status === 'read' ? 'want-to-read' : 'read'));
  }

  if (saveButton) {
    saveButton.addEventListener('click', () => saveBook(currentBook));
  }

  if (removeButton) {
    removeButton.addEventListener('click', () => removeBook(currentBook.key));
  }
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  state.currentView = 'search';
  state.searchQuery = searchInput.value.trim();
  searchBar.classList.remove('expanded');
  fetchResults(state.searchQuery);
});

searchInput.addEventListener('input', () => {
  state.currentView = 'search';
  state.searchQuery = searchInput.value.trim();
  clearTimeout(state.searchTimer);
  state.searchTimer = setTimeout(() => {
    fetchResults(state.searchQuery);
  }, 350);
});

searchBar.addEventListener('click', () => {
  searchBar.classList.add('expanded');
  searchInput.focus();
});

searchInput.addEventListener('focus', () => {
  searchBar.classList.add('expanded');
});

searchInput.addEventListener('blur', () => {
  if (!searchInput.value.trim()) {
    searchBar.classList.remove('expanded');
  }
});

bookshelfToggle.addEventListener('click', () => {
  renderBookshelf();
});

filterToggle.addEventListener('click', () => toggleSidebar());
filterClose.addEventListener('click', () => toggleSidebar(false));
sidebarOverlay.addEventListener('click', () => toggleSidebar(false));

sortBy.addEventListener('change', renderResults);
publicationEra.addEventListener('change', renderResults);
hasCoverToggle.addEventListener('change', renderResults);
minimumEditions.addEventListener('change', renderResults);

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (event) => {
  if (event.target === modalOverlay) {
    closeModal();
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
    toggleSidebar(false);
  }
});

emptyStateClose.addEventListener('click', dismissEmptyState);

loadSavedBooks();
renderResults();
