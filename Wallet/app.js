"use strict";

const DATA_URL = "./barcodes/data.json";
const VERSION_URL = "./version.json";
const FAVORITES_KEY = "favorites";
const APP_VERSION = "2026.04.1";

const state = {
  cards: [],
  favorites: new Set(),
  search: "",
  selectedCardId: null,
  installPrompt: null,
  swRegistration: null,
  latestVersion: APP_VERSION,
  menuOpen: false
};

window.walletState = state;

const refs = {
  pages: document.getElementById("pages"),
  searchInput: document.getElementById("searchInput"),
  favoritesGrid: document.getElementById("favoritesGrid"),
  walletGrid: document.getElementById("walletGrid"),
  emptyState: document.getElementById("emptyState"),
  favoriteCountLabel: document.getElementById("favoriteCountLabel"),
  totalCardsLabel: document.getElementById("totalCardsLabel"),
  installBanner: document.getElementById("installBanner"),
  installButton: document.getElementById("installButton"),
  offlineBanner: document.getElementById("offlineBanner"),
  offlineDismiss: document.getElementById("offlineDismiss"),
  detailOverlay: document.getElementById("detailOverlay"),
  detailTitle: document.getElementById("detailTitle"),
  barcodeBox: document.getElementById("barcodeBox"),
  closeDetailButton: document.getElementById("closeDetailButton"),
  appMenuButton: document.getElementById("appMenuButton"),
  appMenu: document.getElementById("appMenu"),
  currentVersionLabel: document.getElementById("currentVersionLabel"),
  latestVersionLabel: document.getElementById("latestVersionLabel"),
  forceUpdateButton: document.getElementById("forceUpdateButton"),
  toast: document.getElementById("toast")
};

document.addEventListener("DOMContentLoaded", initApp);

async function initApp() {
  bindEvents();
  loadFavorites();
  setupInstallPrompt();
  registerServiceWorker();
  updateNetworkStatus();

  try {
    state.cards = await loadCards();
    render();
  } catch (error) {
    console.error("[Wallet] Failed to initialize", error);
    showEmptyState("Не удалось загрузить карты.");
  }
}

async function loadCards() {
  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(`data.json request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const rawCards = Array.isArray(payload) ? payload : [];
  const cards = rawCards.map(sanitizeCard).filter(Boolean);

  if (!cards.length) {
    throw new Error("No valid cards found in data.json");
  }

  return cards.map((card) => ({
    ...card,
    favorite: state.favorites.has(card.id)
  }));
}

function sanitizeCard(rawCard) {
  if (!rawCard || typeof rawCard !== "object") {
    return null;
  }

  const id = String(rawCard.id || "").trim();
  const name = String(rawCard.name || "").trim();
  const barcodeImage = String(rawCard.barcodeImage || "").trim();
  const color = String(rawCard.color || "#2563eb").trim();

  if (!id || !name || !barcodeImage) {
    console.warn("[Wallet] Invalid card skipped", rawCard);
    return null;
  }

  return { id, name, barcodeImage, color };
}

function bindEvents() {
  on(refs.searchInput, "input", (event) => {
    state.search = event.target.value;
    renderHome();
  });

  on(refs.closeDetailButton, "click", closeDetail);

  on(refs.detailOverlay, "click", (event) => {
    if (event.target === refs.detailOverlay) {
      closeDetail();
    }
  });

  on(refs.installButton, "click", triggerInstall);
  on(refs.appMenuButton, "click", toggleAppMenu);
  on(refs.forceUpdateButton, "click", forceUpdate);
  on(refs.offlineDismiss, "click", () => hide(refs.offlineBanner));

  document.addEventListener("click", (event) => {
    if (
      refs.appMenu &&
      refs.appMenuButton &&
      !refs.appMenu.contains(event.target) &&
      !refs.appMenuButton.contains(event.target)
    ) {
      setAppMenuOpen(false);
    }
  });

  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDetail();
    }
  });
}

function render() {
  renderHome();
  renderVersionLabels();
}

function renderHome() {
  if (!refs.walletGrid) {
    return;
  }

  const cards = getFilteredCards();
  const favorites = cards.filter((card) => card.favorite);

  setText(refs.favoriteCountLabel, String(favorites.length));
  setText(refs.totalCardsLabel, String(cards.length));
  if (refs.emptyState) {
    refs.emptyState.hidden = cards.length > 0;
  }

  if (refs.favoritesGrid) {
    replaceChildren(refs.favoritesGrid, favorites.length
      ? favorites.map((card) => createMiniCard(card))
      : [createMessage("Нет избранных карт")]
    );
  }

  replaceChildren(refs.walletGrid, cards.map((card) => createWalletCard(card)));
}

function createWalletCard(card) {
  const button = document.createElement("article");
  button.className = "wallet-card";
  button.tabIndex = 0;
  button.setAttribute("role", "button");
  button.setAttribute("aria-label", card.name);
  button.style.setProperty("--card-color", card.color);
  button.dataset.cardId = card.id;
  button.innerHTML = `
    <span class="brand-mark">${escapeHtml(card.name)}</span>
    ${favoriteButtonMarkup(card)}
    <span class="wallet-card__label">Штрихкод</span>
  `;
  button.addEventListener("click", (event) => {
    if (event.target.closest(".favorite-button")) {
      return;
    }
    openDetail(card.id);
  });
  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDetail(card.id);
    }
  });
  bindFavoriteButton(button, card.id);
  return button;
}

function createMiniCard(card) {
  const button = document.createElement("article");
  button.className = "mini-card";
  button.tabIndex = 0;
  button.setAttribute("role", "button");
  button.setAttribute("aria-label", card.name);
  button.style.setProperty("--card-color", card.color);
  button.innerHTML = `
    ${favoriteButtonMarkup(card)}
    <span>${escapeHtml(card.name)}</span>
  `;
  button.addEventListener("click", (event) => {
    if (event.target.closest(".favorite-button")) {
      return;
    }
    openDetail(card.id);
  });
  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDetail(card.id);
    }
  });
  bindFavoriteButton(button, card.id);
  return button;
}

function favoriteButtonMarkup(card) {
  const active = card.favorite ? " is-active" : "";
  const label = card.favorite ? "Убрать из избранного" : "Добавить в избранное";
  return `
    <button type="button" class="favorite-button${active}" data-favorite-id="${escapeHtml(card.id)}" aria-label="${label}">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 4h10a2 2 0 0 1 2 2v14l-7-3.6L5 20V6a2 2 0 0 1 2-2Z"></path>
      </svg>
    </button>
  `;
}

function bindFavoriteButton(scope, cardId) {
  const button = scope.querySelector("[data-favorite-id]");
  if (!button) {
    return;
  }
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleFavorite(cardId);
  });
}

function openDetail(cardId) {
  const card = state.cards.find((item) => item.id === cardId);
  if (!card) {
    return;
  }

  state.selectedCardId = card.id;
  setText(refs.detailTitle, card.name);
  renderBarcode(card);

  if (refs.detailOverlay) {
    refs.detailOverlay.classList.add("is-visible");
    refs.detailOverlay.setAttribute("aria-hidden", "false");
  }
}

function renderBarcode(card) {
  if (!refs.barcodeBox) {
    return;
  }

  refs.barcodeBox.innerHTML = "";
  const image = document.createElement("img");
  image.className = "wallet-card__image";
  image.src = card.barcodeImage;
  image.alt = `${card.name} barcode`;
  image.decoding = "async";
  image.draggable = false;
  refs.barcodeBox.append(image);
}

function closeDetail() {
  if (refs.detailOverlay) {
    refs.detailOverlay.classList.remove("is-visible");
    refs.detailOverlay.setAttribute("aria-hidden", "true");
  }
  if (refs.barcodeBox) {
    refs.barcodeBox.innerHTML = "";
  }
  state.selectedCardId = null;
}

function toggleFavorite(cardId) {
  const card = state.cards.find((item) => item.id === cardId);
  if (!card) {
    return;
  }

  card.favorite = !card.favorite;
  if (card.favorite) {
    state.favorites.add(card.id);
  } else {
    state.favorites.delete(card.id);
  }

  saveFavorites();
  renderHome();
}

function loadFavorites() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    state.favorites = new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch (_error) {
    state.favorites = new Set();
  }
}

function saveFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(state.favorites)));
}

function getFilteredCards() {
  const query = state.search.trim().toLocaleLowerCase("ru-RU");
  const sorted = state.cards.slice().sort((a, b) => {
    if (a.favorite !== b.favorite) {
      return a.favorite ? -1 : 1;
    }
    return a.name.localeCompare(b.name, "ru-RU");
  });

  if (!query) {
    return sorted;
  }

  return sorted.filter((card) =>
    `${card.name} ${card.id}`.toLocaleLowerCase("ru-RU").includes(query)
  );
}

function updateNetworkStatus() {
  if (refs.offlineBanner) {
    refs.offlineBanner.hidden = navigator.onLine;
  }
}

function setupInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.installPrompt = event;
    show(refs.installBanner);
  });

  window.addEventListener("appinstalled", () => {
    state.installPrompt = null;
    hide(refs.installBanner);
    showToast("Wallet установлен");
  });
}

async function triggerInstall() {
  if (!state.installPrompt) {
    showToast("Откройте установку через меню браузера");
    return;
  }

  state.installPrompt.prompt();
  await state.installPrompt.userChoice;
  state.installPrompt = null;
  hide(refs.installBanner);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") {
    return;
  }

  navigator.serviceWorker.register("./service-worker.js", { scope: "./" }).then((registration) => {
    state.swRegistration = registration;
    renderVersionLabels();
  }).catch((error) => {
    console.warn("[Wallet] Service worker registration failed", error);
  });
}

async function forceUpdate() {
  setAppMenuOpen(false);
  if (!navigator.onLine) {
    showToast("Для обновления нужен интернет");
    return;
  }

  showToast("Обновление...");

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  await Promise.allSettled([
    fetch("./index.html", { cache: "reload" }),
    fetch("./app.js", { cache: "reload" }),
    fetch("./styles.css", { cache: "reload" }),
    fetch("./service-worker.js", { cache: "reload" }),
    fetch("./version.json", { cache: "reload" })
  ]);

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  const nextUrl = new URL(location.href);
  nextUrl.searchParams.set("update", String(Date.now()));
  location.replace(nextUrl.href);
}

function toggleAppMenu() {
  const nextOpen = !state.menuOpen;
  setAppMenuOpen(nextOpen);
  if (nextOpen) {
    refreshLatestVersion();
  }
}

function setAppMenuOpen(open) {
  if (!refs.appMenu || !refs.appMenuButton) {
    return;
  }

  state.menuOpen = open;
  refs.appMenu.hidden = !open;
  refs.appMenuButton.setAttribute("aria-expanded", String(open));
}

function renderVersionLabels() {
  setText(refs.currentVersionLabel, APP_VERSION);
  setText(refs.latestVersionLabel, state.latestVersion);
}

async function refreshLatestVersion() {
  if (!navigator.onLine) {
    state.latestVersion = "офлайн";
    renderVersionLabels();
    return;
  }

  try {
    const response = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`version request failed with status ${response.status}`);
    }
    const payload = await response.json();
    state.latestVersion = String(payload.version || APP_VERSION);
  } catch (_error) {
    state.latestVersion = "неизвестно";
  }
  renderVersionLabels();
}

function createMessage(message) {
  const node = document.createElement("div");
  node.className = "empty-state";
  node.textContent = message;
  return node;
}

function showEmptyState(message) {
  if (refs.emptyState) {
    refs.emptyState.hidden = false;
    refs.emptyState.textContent = message;
  }
  setText(refs.favoriteCountLabel, "0");
  setText(refs.totalCardsLabel, "0");
}

function replaceChildren(parent, children) {
  if (!parent) {
    return;
  }

  parent.innerHTML = "";
  parent.append(...children);
}

function show(element) {
  if (!element) {
    return;
  }
  element.hidden = false;
}

function hide(element) {
  if (!element) {
    return;
  }
  element.hidden = true;
}

function showToast(message) {
  if (!refs.toast) {
    return;
  }

  refs.toast.textContent = message;
  refs.toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    refs.toast.hidden = true;
  }, 2200);
}

function on(element, eventName, handler) {
  if (element) {
    element.addEventListener(eventName, handler);
  }
}

function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
