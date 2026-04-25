const elements = {
  ambientGlow: document.getElementById("ambientGlow"),
  walletStage: document.getElementById("walletStage"),
  cardsTrack: document.getElementById("cardsTrack"),
  activeTitle: document.getElementById("activeTitle"),
  statusText: document.getElementById("statusText"),
  activeIndex: document.getElementById("activeIndex"),
  toggleExpandBtn: document.getElementById("toggleExpandBtn")
};

const state = {
  cards: [],
  position: 0,
  activeIndex: 0,
  dragging: false,
  dragAxis: null,
  pointerId: null,
  startX: 0,
  startY: 0,
  startPosition: 0,
  samples: [],
  expanded: false
};

initialize();

async function initialize() {
  bindEvents();

  try {
    await loadCards();
    renderCards();
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
  elements.toggleExpandBtn.addEventListener("click", () => {
    setExpanded(!state.expanded);
  });

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", updateScene);
}

async function loadCards() {
  const response = await fetch("cards.json", { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`cards.json request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const rawCards = Array.isArray(payload.cards) ? payload.cards : [];

  state.cards = rawCards
    .map((card, index) => sanitizeCard(card, index))
    .filter(Boolean);

  if (!state.cards.length) {
    throw new Error("No valid cards found in cards.json");
  }
}

function sanitizeCard(rawCard, index) {
  if (!rawCard || typeof rawCard !== "object") {
    return null;
  }

  const id = String(rawCard.id || `card_${index + 1}`).trim();
  const title = String(rawCard.title || "Wallet Card").trim();
  const image = typeof rawCard.image === "string" ? rawCard.image.trim() : "";

  if (!image) {
    return null;
  }

  return {
    id,
    title,
    image
  };
}

function renderCards() {
  elements.cardsTrack.innerHTML = "";

  const fragment = document.createDocumentFragment();

  state.cards.forEach((card, index) => {
    const cardElement = document.createElement("article");
    cardElement.className = "wallet-card";
    cardElement.dataset.index = String(index);
    cardElement.setAttribute("role", "listitem");
    cardElement.setAttribute("aria-label", card.title);

    const viewport = document.createElement("div");
    viewport.className = "wallet-card__viewport";

    const image = document.createElement("img");
    image.className = "wallet-card__image";
    image.src = card.image;
    image.alt = "";
    image.loading = "lazy";
    image.draggable = false;

    const label = document.createElement("div");
    label.className = "wallet-card__label";

    const title = document.createElement("span");
    title.textContent = card.title;

    const id = document.createElement("span");
    id.className = "wallet-card__id";
    id.textContent = shortId(card.id);

    label.append(title, id);
    viewport.append(image, label);
    cardElement.append(viewport);
    fragment.append(cardElement);
  });

  elements.cardsTrack.append(fragment);
}

function updateScene() {
  if (!state.cards.length) {
    return;
  }

  const maxIndex = state.cards.length - 1;
  state.position = clamp(state.position, 0, maxIndex);
  state.activeIndex = clamp(Math.round(state.position), 0, maxIndex);

  const spacing = getCardSpacing();
  const heights = getCardHeights();
  const collapsedHeight = heights.collapsed;
  const previewHeight = heights.preview;
  const expandedHeight = heights.expanded;
  const cards = elements.cardsTrack.querySelectorAll(".wallet-card");

  cards.forEach((card, index) => {
    const offset = index - state.position;
    const distance = Math.abs(offset);
    const x = offset * spacing;
    const y = Math.pow(distance, 1.1) * 10;

    let scale = Math.max(0.92, 1 - distance * 0.06);
    let opacity = Math.max(0.5, 1 - distance * 0.25);
    let blur = Math.max(0, (distance - 0.2) * 2.2);

    if (state.expanded) {
      if (index === state.activeIndex) {
        scale = 1;
        opacity = 1;
        blur = 0;
      } else {
        scale = 0.9;
        opacity = 0;
        blur = 4;
      }
    }

    const focus = Math.max(0, 1 - distance);
    const height = state.expanded
      ? (index === state.activeIndex ? expandedHeight : collapsedHeight)
      : collapsedHeight + (previewHeight - collapsedHeight) * focus;

    card.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), 0) scale(${scale})`;
    card.style.opacity = opacity.toFixed(3);
    card.style.filter = `blur(${blur.toFixed(2)}px)`;
    card.style.height = `${height.toFixed(2)}px`;
    card.style.zIndex = String(1000 - Math.round(distance * 100));
    card.classList.toggle("is-active", index === state.activeIndex);
  });

  const active = state.cards[state.activeIndex];
  elements.activeTitle.textContent = active.title;
  elements.statusText.textContent = state.expanded
    ? "Swipe down to collapse"
    : "Swipe left or right to switch cards";
  elements.activeIndex.textContent = `${state.activeIndex + 1}/${state.cards.length}`;
  elements.toggleExpandBtn.textContent = state.expanded ? "Collapse" : "Open Card";

  elements.ambientGlow.style.background =
    `radial-gradient(620px 380px at 50% 46%, rgba(255, 255, 255, 0.16), transparent 72%), url(${active.image}) center / cover no-repeat`;
}

function onPointerDown(event) {
  if (!state.cards.length) {
    return;
  }

  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  state.dragging = true;
  state.dragAxis = null;
  state.pointerId = event.pointerId;
  state.startX = event.clientX;
  state.startY = event.clientY;
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

  const deltaX = event.clientX - state.startX;
  const deltaY = event.clientY - state.startY;

  if (!state.dragAxis) {
    if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
      state.dragAxis = Math.abs(deltaX) >= Math.abs(deltaY) ? "x" : "y";
    } else {
      return;
    }
  }

  if (state.dragAxis === "x" && !state.expanded) {
    event.preventDefault();
    const rawPosition = state.startPosition - deltaX / getCardSpacing();
    state.position = applyEdgeResistance(rawPosition);
    recordSample(event.clientX);
    updateScene();
  }
}

function onPointerUp(event) {
  if (!state.dragging) {
    return;
  }

  if (state.pointerId !== null && event.pointerId !== state.pointerId) {
    return;
  }

  const deltaY = event.clientY - state.startY;

  state.dragging = false;
  elements.walletStage.classList.remove("is-dragging");

  if (state.dragAxis === "x" && !state.expanded) {
    const velocity = estimateVelocity();
    const projected = state.position - (velocity * 180) / getCardSpacing();
    snapTo(Math.round(projected));
  } else if (state.dragAxis === "y") {
    if (deltaY < -56) {
      setExpanded(true);
    } else if (deltaY > 56) {
      setExpanded(false);
    }
  }

  state.pointerId = null;
  state.samples = [];
}

function onCardClick(event) {
  const cardElement = event.target.closest(".wallet-card");

  if (!cardElement || !state.cards.length) {
    return;
  }

  const index = Number(cardElement.dataset.index);

  if (Number.isNaN(index)) {
    return;
  }

  if (index !== state.activeIndex) {
    setExpanded(false);
    snapTo(index);
    return;
  }

  setExpanded(!state.expanded);
}

function onKeyDown(event) {
  if (!state.cards.length) {
    return;
  }

  if (event.key === "ArrowLeft" && !state.expanded) {
    event.preventDefault();
    snapTo(state.activeIndex - 1);
  }

  if (event.key === "ArrowRight" && !state.expanded) {
    event.preventDefault();
    snapTo(state.activeIndex + 1);
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    setExpanded(true);
  }

  if (event.key === "ArrowDown" || event.key === "Escape") {
    event.preventDefault();
    setExpanded(false);
  }
}

function setExpanded(expanded) {
  state.expanded = expanded;
  elements.walletStage.classList.toggle("is-expanded", expanded);
  updateScene();
}

function snapTo(index) {
  if (!state.cards.length) {
    return;
  }

  state.position = clamp(index, 0, state.cards.length - 1);
  updateScene();
}

function recordSample(x) {
  const now = performance.now();
  state.samples.push({ x, time: now });

  while (state.samples.length > 2 && now - state.samples[0].time > 140) {
    state.samples.shift();
  }
}

function estimateVelocity() {
  if (state.samples.length < 2) {
    return 0;
  }

  const first = state.samples[0];
  const last = state.samples[state.samples.length - 1];
  const dt = Math.max(1, last.time - first.time);
  return (last.x - first.x) / dt;
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
  return clamp(width * 0.44, 140, 230);
}

function showEmptyState(message) {
  elements.cardsTrack.innerHTML = `<div class="wallet-empty">${message}</div>`;
  elements.activeTitle.textContent = "Wallet";
  elements.statusText.textContent = message;
  elements.activeIndex.textContent = "0/0";
  elements.toggleExpandBtn.disabled = true;
}

function shortId(value) {
  if (value.length <= 10) {
    return value;
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getCardHeights() {
  const mobile = window.innerWidth <= 760;
  const vh = window.innerHeight;

  if (mobile) {
    return {
      collapsed: 110,
      preview: Math.min(vh * 0.64, 540),
      expanded: Math.min(vh * 0.78, 640)
    };
  }

  return {
    collapsed: 128,
    preview: Math.min(vh * 0.7, 660),
    expanded: Math.min(vh * 0.82, 720)
  };
}
