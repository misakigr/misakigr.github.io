"use strict";

const DATA_URL = "barcodes/data.json";
const PLACEHOLDER_IMAGE = "barcodes/placeholder.png";
const FAVORITES_KEY = "favorites";

const state = {
  cards: [],
  favorites: new Set(),
  activePage: "home",
  search: "",
  selectedCardId: null,
  installPrompt: null,
  swRegistration: null
};

window.walletState = state;

const refs = {
  pages: document.getElementById("pages"),
  searchInput: document.getElementById("searchInput"),
  favoritesGrid: document.getElementById("favoritesGrid"),
  walletGrid: document.getElementById("walletGrid"),
  catalogGrid: document.getElementById("catalogGrid"),
  emptyState: document.getElementById("emptyState"),
  favoriteCountLabel: document.getElementById("favoriteCountLabel"),
  totalCardsLabel: document.getElementById("totalCardsLabel"),
  installBanner: document.getElementById("installBanner"),
  installButton: document.getElementById("installButton"),
  updateBanner: document.getElementById("updateBanner"),
  updateButton: document.getElementById("updateButton"),
  offlineBanner: document.getElementById("offlineBanner"),
  offlineDismiss: document.getElementById("offlineDismiss"),
  detailOverlay: document.getElementById("detailOverlay"),
  detailTitle: document.getElementById("detailTitle"),
  detailHero: document.getElementById("detailHero"),
  detailBrand: document.getElementById("detailBrand"),
  barcodeBox: document.getElementById("barcodeBox"),
  closeDetailButton: document.getElementById("closeDetailButton"),
  toggleFavoriteButton: document.getElementById("toggleFavoriteButton"),
  quickFavorites: document.getElementById("quickFavorites"),
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
    console.log("state.cards[0]", state.cards[0]);
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
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => setActivePage(button.dataset.nav));
  });

  refs.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderHome();
  });

  refs.quickFavorites.addEventListener("click", () => {
    state.search = "";
    refs.searchInput.value = "";
    setActivePage("home");
    refs.favoritesGrid.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  refs.closeDetailButton.addEventListener("click", closeDetail);
  refs.toggleFavoriteButton.addEventListener("click", () => {
    if (state.selectedCardId) {
      toggleFavorite(state.selectedCardId);
      updateDetailFavorite();
    }
  });

  refs.detailOverlay.addEventListener("click", (event) => {
    if (event.target === refs.detailOverlay) {
      closeDetail();
    }
  });

  refs.installButton.addEventListener("click", triggerInstall);
  refs.updateButton.addEventListener("click", applyUpdate);
  refs.offlineDismiss.addEventListener("click", () => hide(refs.offlineBanner));

  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDetail();
    }
  });
}

function render() {
  renderPages();
  renderHome();
  renderCatalog();
}

function renderPages() {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.toggle("is-active", page.dataset.page === state.activePage);
  });
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.nav === state.activePage);
  });
}

function renderHome() {
  const cards = getFilteredCards();
  const favorites = cards.filter((card) => card.favorite);

  refs.favoriteCountLabel.textContent = String(favorites.length);
  refs.totalCardsLabel.textContent = String(cards.length);
  refs.emptyState.hidden = cards.length > 0;

  replaceChildren(refs.favoritesGrid, favorites.length
    ? favorites.map((card) => createMiniCard(card))
    : [createMessage("Нет избранных карт")]
  );

  replaceChildren(refs.walletGrid, cards.map((card) => createWalletCard(card)));
}

function renderCatalog() {
  const items = state.cards.map((card) => {
    const node = document.createElement("button");
    node.type = "button";
    node.className = "catalog-item";
    node.style.setProperty("--card-color", card.color);
    node.innerHTML = `
      <span>${escapeHtml(card.name)}</span>
      <small>${escapeHtml(card.barcodeImage)}</small>
    `;
    node.addEventListener("click", () => openDetail(card.id));
    return node;
  });

  replaceChildren(refs.catalogGrid, items);
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
  refs.detailTitle.textContent = card.name;
  refs.detailBrand.textContent = card.name;
  //refs.detailHero.style.setProperty("--card-color", card.color);
  renderBarcode(card);
  updateDetailFavorite();

  refs.detailOverlay.classList.add("is-visible");
  refs.detailOverlay.setAttribute("aria-hidden", "false");
}

function renderBarcode(card) {
  refs.barcodeBox.innerHTML = "";
  const image = document.createElement("img");
  image.className = "wallet-card__image";
  image.src = card.barcodeImage;
  image.alt = `${card.name} barcode`;
  image.decoding = "async";
  image.draggable = false;
  image.onerror = () => {
    if (!image.src.endsWith(PLACEHOLDER_IMAGE)) {
      image.src = PLACEHOLDER_IMAGE;
      image.alt = "Barcode placeholder";
    }
  };
  refs.barcodeBox.append(image);
}

function closeDetail() {
  refs.detailOverlay.classList.remove("is-visible");
  refs.detailOverlay.setAttribute("aria-hidden", "true");
  refs.barcodeBox.innerHTML = "";
  state.selectedCardId = null;
}

function updateDetailFavorite() {
  const card = state.cards.find((item) => item.id === state.selectedCardId);
  if (!card) {
    return;
  }
  refs.toggleFavoriteButton.classList.toggle("is-active", card.favorite);
  refs.toggleFavoriteButton.setAttribute(
    "aria-label",
    card.favorite ? "Убрать из избранного" : "Добавить в избранное"
  );
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
  renderCatalog();
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

function setActivePage(page) {
  state.activePage = page === "catalog" ? "catalog" : "home";
  renderPages();
}

function updateNetworkStatus() {
  refs.offlineBanner.hidden = navigator.onLine;
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
    if (registration.waiting) {
      show(refs.updateBanner);
    }

    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) {
        return;
      }
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          show(refs.updateBanner);
        }
      });
    });
  }).catch((error) => {
    console.warn("[Wallet] Service worker registration failed", error);
  });
}

function applyUpdate() {
  if (state.swRegistration?.waiting) {
    state.swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
    navigator.serviceWorker.addEventListener("controllerchange", function reloadOnce() {
      navigator.serviceWorker.removeEventListener("controllerchange", reloadOnce);
      location.reload();
    });
    return;
  }

  location.reload();
}

function createMessage(message) {
  const node = document.createElement("div");
  node.className = "empty-state";
  node.textContent = message;
  return node;
}

function showEmptyState(message) {
  refs.emptyState.hidden = false;
  refs.emptyState.textContent = message;
  refs.favoriteCountLabel.textContent = "0";
  refs.totalCardsLabel.textContent = "0";
}

function replaceChildren(parent, children) {
  parent.innerHTML = "";
  parent.append(...children);
}

function show(element) {
  element.hidden = false;
}

function hide(element) {
  element.hidden = true;
}

function showToast(message) {
  refs.toast.textContent = message;
  refs.toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    refs.toast.hidden = true;
  }, 2200);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
