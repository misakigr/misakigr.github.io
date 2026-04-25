const elements = {
  ambientGlow: document.getElementById("ambientGlow"),
  walletStage: document.getElementById("walletStage"),
  cardsTrack: document.getElementById("cardsTrack"),
  walletDots: document.getElementById("walletDots"),
  activeTitle: document.getElementById("activeTitle"),
  activeSubtitle: document.getElementById("activeSubtitle"),
  activeType: document.getElementById("activeType"),
  activeIndex: document.getElementById("activeIndex"),
  openPassBtn: document.getElementById("openPassBtn"),
  passModal: document.getElementById("passModal"),
  passSheet: document.getElementById("passSheet"),
  closePassBtn: document.getElementById("closePassBtn"),
  modalMedia: document.getElementById("modalMedia"),
  modalTitle: document.getElementById("modalTitle"),
  modalSubtitle: document.getElementById("modalSubtitle"),
  modalCode: document.getElementById("modalCode"),
  modalCodeText: document.getElementById("modalCodeText")
};

const TYPE_LABELS = {
  discount: "Discount",
  bank: "Bank",
  id: "ID",
  loyalty: "Loyalty"
};

const ALLOWED_TYPES = new Set(["discount", "bank", "id", "loyalty"]);
const ALLOWED_BARCODE_TYPES = new Set(["qr", "code128"]);
const FALLBACK_COLORS = ["#4f8df5", "#ef5a3c", "#3aa16a", "#cc8d2f", "#2f8f99", "#8a6cf2"];

const state = {
  cards: [],
  position: 0,
  activeIndex: 0,
  dragging: false,
  dragMoved: false,
  pointerId: null,
  startX: 0,
  startPosition: 0,
  samples: []
};

initialize();

async function initialize() {
  bindEvents();

  try {
    await loadCards();
    renderCards();
    renderDots();
    updateScene();
  } catch (error) {
    console.error(error);
    showEmptyState("Could not load cards.json");
  }
}

function bindEvents() {
  elements.walletStage.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  elements.cardsTrack.addEventListener("click", onCardClick);
  elements.openPassBtn.addEventListener("click", () => openPass(state.activeIndex));
  elements.closePassBtn.addEventListener("click", closePass);

  elements.passModal.addEventListener("click", event => {
    if (event.target === elements.passModal) {
      closePass();
    }
  });

  window.addEventListener("resize", () => {
    updateScene();

    if (isModalOpen()) {
      renderCode(state.cards[state.activeIndex]);
    }
  });

  window.addEventListener("keydown", onKeyDown);
}

async function loadCards() {
  const response = await fetch("cards.json", { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`cards.json request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const rawCards = Array.isArray(payload.cards) ? payload.cards : [];

  state.cards = rawCards.map(sanitizeCard).filter(Boolean);

  if (state.cards.length === 0) {
    throw new Error("No valid cards found in cards.json");
  }
}

function sanitizeCard(rawCard, index) {
  if (!rawCard || typeof rawCard !== "object") {
    return null;
  }

  const type = String(rawCard.type || "loyalty").toLowerCase();
  const barcodeType = String(rawCard.barcodeType || "qr").toLowerCase();

  return {
    id: String(rawCard.id || `card-${index + 1}`),
    type: ALLOWED_TYPES.has(type) ? type : "loyalty",
    title: String(rawCard.title || "Wallet Card"),
    subtitle: String(rawCard.subtitle || "Pass"),
    barcode: String(rawCard.barcode || rawCard.code || `CODE${index + 1}`),
    barcodeType: ALLOWED_BARCODE_TYPES.has(barcodeType) ? barcodeType : "qr",
    image: sanitizePath(rawCard.image),
    bg: sanitizePath(rawCard.bg),
    color: sanitizeColor(rawCard.color, index)
  };
}

function sanitizePath(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function sanitizeColor(value, index) {
  if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value.trim())) {
    return value.trim();
  }

  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function renderCards() {
  elements.cardsTrack.innerHTML = "";

  const fragment = document.createDocumentFragment();

  state.cards.forEach((card, index) => {
    const cardElement = document.createElement("article");
    cardElement.className = "wallet-card";
    cardElement.dataset.index = String(index);
    cardElement.setAttribute("role", "listitem");
    cardElement.setAttribute("aria-label", `${card.title}, ${card.subtitle}`);
    cardElement.style.setProperty("--card-color", card.color);

    if (card.image) {
      const image = document.createElement("img");
      image.className = "wallet-card__image";
      image.src = card.image;
      image.alt = "";
      image.loading = "lazy";
      image.addEventListener("error", () => image.remove());
      cardElement.appendChild(image);
    }

    const shine = document.createElement("div");
    shine.className = "wallet-card__shine";
    cardElement.appendChild(shine);

    const header = document.createElement("div");
    header.className = "wallet-card__header";

    const type = document.createElement("span");
    type.className = "wallet-card__type";
    type.textContent = TYPE_LABELS[card.type] || card.type;

    const id = document.createElement("span");
    id.className = "wallet-card__id";
    id.textContent = shortId(card.id);

    header.append(type, id);
    cardElement.appendChild(header);

    const content = document.createElement("div");
    content.className = "wallet-card__content";

    const title = document.createElement("h2");
    title.className = "wallet-card__title";
    title.textContent = card.title;

    const subtitle = document.createElement("p");
    subtitle.className = "wallet-card__subtitle";
    subtitle.textContent = card.subtitle;

    content.append(title, subtitle);
    cardElement.appendChild(content);

    const footer = document.createElement("div");
    footer.className = "wallet-card__footer";

    const barcodeLabel = document.createElement("span");
    barcodeLabel.className = "wallet-card__barcode";
    barcodeLabel.textContent = card.barcodeType === "qr" ? "QR PASS" : "CODE 128";

    const indicator = document.createElement("span");
    indicator.className = "wallet-card__indicator";

    footer.append(barcodeLabel, indicator);
    cardElement.appendChild(footer);

    fragment.appendChild(cardElement);
  });

  elements.cardsTrack.appendChild(fragment);
}

function renderDots() {
  elements.walletDots.innerHTML = "";

  const fragment = document.createDocumentFragment();

  state.cards.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "wallet-dot";
    dot.dataset.index = String(index);
    dot.setAttribute("aria-label", `Go to card ${index + 1}`);
    dot.addEventListener("click", () => snapTo(index));
    fragment.appendChild(dot);
  });

  elements.walletDots.appendChild(fragment);
}

function showEmptyState(message) {
  elements.cardsTrack.innerHTML = `<div class="wallet-empty">${message}</div>`;
  elements.walletDots.innerHTML = "";
  elements.activeTitle.textContent = "Wallet";
  elements.activeSubtitle.textContent = message;
  elements.activeType.textContent = "--";
  elements.activeIndex.textContent = "0/0";
  elements.openPassBtn.disabled = true;
}

function updateScene() {
  if (!state.cards.length) {
    return;
  }

  const maxIndex = state.cards.length - 1;
  state.position = clamp(state.position, 0, maxIndex);

  const nextActive = clamp(Math.round(state.position), 0, maxIndex);
  state.activeIndex = nextActive;

  const spacing = getCardSpacing();
  const cardElements = elements.cardsTrack.querySelectorAll(".wallet-card");

  cardElements.forEach((cardElement, index) => {
    const offset = index - state.position;
    const distance = Math.abs(offset);

    const x = offset * spacing;
    const y = Math.pow(distance, 1.15) * 14;
    const scale = Math.max(0.78, 1 - distance * 0.1);
    const opacity = Math.max(0.2, 1 - distance * 0.24);
    const blur = Math.max(0, (distance - 0.1) * 2.8);
    const rotate = offset * -4;
    const z = 600 - Math.round(distance * 100);

    cardElement.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), 0) scale(${scale}) rotateZ(${rotate}deg)`;
    cardElement.style.opacity = opacity.toFixed(3);
    cardElement.style.filter = `blur(${blur.toFixed(2)}px) saturate(${(1 - distance * 0.1).toFixed(2)})`;
    cardElement.style.zIndex = String(z);
    cardElement.classList.toggle("is-active", index === state.activeIndex);
  });

  updateLabels();
  updateDots();
}

function updateLabels() {
  const activeCard = state.cards[state.activeIndex];

  if (!activeCard) {
    return;
  }

  elements.activeTitle.textContent = activeCard.title;
  elements.activeSubtitle.textContent = activeCard.subtitle;
  elements.activeType.textContent = TYPE_LABELS[activeCard.type] || activeCard.type;
  elements.activeIndex.textContent = `${state.activeIndex + 1}/${state.cards.length}`;

  document.documentElement.style.setProperty("--active-color", activeCard.color);

  elements.ambientGlow.style.filter = "blur(52px) saturate(1.35)";
}

function updateDots() {
  const dots = elements.walletDots.querySelectorAll(".wallet-dot");

  dots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === state.activeIndex);
  });
}

function onPointerDown(event) {
  if (!state.cards.length || isModalOpen()) {
    return;
  }

  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  state.dragging = true;
  state.dragMoved = false;
  state.pointerId = event.pointerId;
  state.startX = event.clientX;
  state.startPosition = state.position;
  state.samples = [];

  recordSample(event.clientX);
  elements.walletStage.classList.add("is-dragging");

  try {
    elements.walletStage.setPointerCapture(event.pointerId);
  } catch (_error) {
    state.pointerId = null;
  }
}

function onPointerMove(event) {
  if (!state.dragging) {
    return;
  }

  if (state.pointerId !== null && event.pointerId !== state.pointerId) {
    return;
  }

  event.preventDefault();

  const deltaX = event.clientX - state.startX;

  if (!state.dragMoved && Math.abs(deltaX) > 8) {
    state.dragMoved = true;
  }

  const rawPosition = state.startPosition - deltaX / getCardSpacing();
  state.position = applyEdgeResistance(rawPosition);

  recordSample(event.clientX);
  updateScene();
}

function onPointerUp(event) {
  if (!state.dragging) {
    return;
  }

  if (state.pointerId !== null && event.pointerId !== state.pointerId) {
    return;
  }

  state.dragging = false;
  elements.walletStage.classList.remove("is-dragging");

  const maxIndex = state.cards.length - 1;
  const velocity = estimateVelocity();
  const projected = state.position - (velocity * 190) / getCardSpacing();

  let target = clamp(Math.round(projected), 0, maxIndex);

  if (Math.abs(velocity) < 0.05) {
    target = clamp(Math.round(state.position), 0, maxIndex);
  }

  if (!state.dragMoved) {
    target = clamp(Math.round(state.startPosition), 0, maxIndex);
  }

  snapTo(target);
  state.samples = [];
  state.pointerId = null;
}

function onCardClick(event) {
  if (!state.cards.length || state.dragMoved) {
    return;
  }

  const cardElement = event.target.closest(".wallet-card");

  if (!cardElement) {
    return;
  }

  const index = Number(cardElement.dataset.index);

  if (Number.isNaN(index)) {
    return;
  }

  if (index !== state.activeIndex) {
    snapTo(index);
    return;
  }

  openPass(index);
}

function onKeyDown(event) {
  if (!state.cards.length) {
    return;
  }

  if (event.key === "Escape" && isModalOpen()) {
    closePass();
    return;
  }

  if (isModalOpen()) {
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    snapTo(state.activeIndex - 1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    snapTo(state.activeIndex + 1);
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openPass(state.activeIndex);
  }
}

function snapTo(index) {
  if (!state.cards.length) {
    return;
  }

  const safeIndex = clamp(index, 0, state.cards.length - 1);
  state.position = safeIndex;
  updateScene();
}

function recordSample(x) {
  const now = performance.now();
  state.samples.push({ x, time: now });

  while (state.samples.length > 2 && now - state.samples[0].time > 150) {
    state.samples.shift();
  }
}

function estimateVelocity() {
  if (state.samples.length < 2) {
    return 0;
  }

  const first = state.samples[0];
  const last = state.samples[state.samples.length - 1];
  const duration = Math.max(1, last.time - first.time);

  return (last.x - first.x) / duration;
}

function applyEdgeResistance(position) {
  const maxIndex = state.cards.length - 1;

  if (position < 0) {
    return position * 0.28;
  }

  if (position > maxIndex) {
    return maxIndex + (position - maxIndex) * 0.28;
  }

  return position;
}

function getCardSpacing() {
  const width = elements.walletStage.clientWidth || window.innerWidth;
  return clamp(width * 0.55, 180, 260);
}

function openPass(index) {
  const card = state.cards[index];

  if (!card) {
    return;
  }

  elements.modalTitle.textContent = card.title;
  elements.modalSubtitle.textContent = card.subtitle;
  elements.modalCodeText.textContent = formatReadableCode(card);
  elements.modalMedia.style.setProperty("--pass-color", card.color);
  elements.modalMedia.innerHTML = "";

  if (card.image) {
    const image = document.createElement("img");
    image.src = card.image;
    image.alt = "";
    image.loading = "lazy";
    image.addEventListener("error", () => image.remove());
    elements.modalMedia.appendChild(image);
  }

  renderCode(card);

  if (typeof elements.passModal.showModal === "function") {
    if (!elements.passModal.open) {
      elements.passModal.showModal();
    }
  } else {
    elements.passModal.setAttribute("open", "");
  }
}

function closePass() {
  if (typeof elements.passModal.close === "function" && elements.passModal.open) {
    elements.passModal.close();
    return;
  }

  elements.passModal.removeAttribute("open");
}

function isModalOpen() {
  return elements.passModal.open || elements.passModal.hasAttribute("open");
}

function renderCode(card) {
  if (!card) {
    return;
  }

  if (card.barcodeType === "qr") {
    renderQrCode(elements.modalCode, card.barcode);
    return;
  }

  renderCode128(elements.modalCode, card.barcode);
}

function renderQrCode(canvas, value) {
  const size = 220;
  const dpr = setCanvasSize(canvas, size, size);

  if (typeof window.QRious === "function") {
    new window.QRious({
      element: canvas,
      value,
      level: "H",
      size: Math.round(size * dpr),
      background: "#ffffff",
      foreground: "#101217",
      padding: 0
    });
    return;
  }

  drawFallback(canvas, `QR ${value}`);
}

function renderCode128(canvas, value) {
  const width = 292;
  const height = 108;
  const dpr = setCanvasSize(canvas, width, height);

  if (typeof window.JsBarcode === "function") {
    try {
      window.JsBarcode(canvas, value, {
        format: "CODE128",
        width: 1.9 * dpr,
        height: 80 * dpr,
        margin: 10 * dpr,
        displayValue: false,
        background: "#ffffff",
        lineColor: "#101217"
      });
      return;
    } catch (_error) {
      drawFallback(canvas, value);
      return;
    }
  }

  drawFallback(canvas, value);
}

function setCanvasSize(canvas, cssWidth, cssHeight) {
  const dpr = clamp(window.devicePixelRatio || 1, 1, 3);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  return dpr;
}

function drawFallback(canvas, text) {
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return;
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0f1624";
  ctx.font = `${Math.max(20, Math.round(canvas.height * 0.18))}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Code", canvas.width / 2, canvas.height * 0.42);
  ctx.font = `${Math.max(12, Math.round(canvas.height * 0.12))}px sans-serif`;
  ctx.fillText(text.slice(0, 34), canvas.width / 2, canvas.height * 0.68);
}

function formatReadableCode(card) {
  if (!card || !card.barcode) {
    return "";
  }

  if (card.barcodeType === "qr") {
    return card.barcode;
  }

  return card.barcode.replace(/(.{4})/g, "$1 ").trim();
}

function shortId(id) {
  const normalized = String(id).replace(/[^a-z0-9]/gi, "").toUpperCase();
  if (normalized.length <= 6) {
    return normalized;
  }

  return normalized.slice(-6);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
