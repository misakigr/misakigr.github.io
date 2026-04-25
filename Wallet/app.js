const DATA_KEY = "wallet_cards_data";

const stack = document.getElementById("walletStack");
const aboutPanel = document.getElementById("aboutPanel");
const dataVersionEl = document.getElementById("dataVersion");

let cards = [];
let currentIndex = 0;

/* =========================
   ЗАГРУЗКА ДАННЫХ
========================= */

async function fetchFresh() {
  const res = await fetch("cards.json?t=" + Date.now(), {
    cache: "no-store"
  });

  return res.json();
}

function saveLocal(data) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

function loadLocal() {
  const data = localStorage.getItem(DATA_KEY);
  return data ? JSON.parse(data) : null;
}

/* =========================
   ИНИЦИАЛИЗАЦИЯ
========================= */

async function init() {
  let data = loadLocal();

  if (data) {
    render(data);
  } else {
    data = await fetchFresh();
    saveLocal(data);
    render(data);
  }
}

window.addEventListener("load", init);

/* =========================
   РЕНДЕР КАРТ
========================= */

function render(data) {
  cards = data.cards || [];
  stack.innerHTML = "";

  cards.forEach((card, index) => {
    const el = document.createElement("div");
    el.className = "wallet-card";

    el.innerHTML = `
      <div class="wallet-card-content">
        <div>
          <div class="wallet-title">${card.title || ""}</div>
          <div class="wallet-subtitle">${card.subtitle || ""}</div>
        </div>

        <div class="barcode-box">
          <img src="${card.image}" />
        </div>
      </div>
    `;

    stack.appendChild(el);
  });

  currentIndex = 0;
  updateStack();

  if (data.version !== undefined) {
    dataVersionEl.innerText = data.version;
  }
}

/* =========================
   СТЕК КАРТ
========================= */

function updateStack() {
  const elements = Array.from(stack.children);

  elements.forEach((el, i) => {
    const offset = i - currentIndex;

    if (offset < 0) {
      el.style.transform = `translateY(-40px) scale(0.9)`;
      el.style.opacity = 0;
    } else {
      el.style.transform = `
        translateY(${offset * 12}px)
        scale(${1 - offset * 0.04})
      `;
      el.style.opacity = 1 - offset * 0.2;
      el.style.zIndex = 10 - offset;
    }
  });
}

/* =========================
   СВАЙП (TOUCH)
========================= */

let startY = 0;

stack.addEventListener("touchstart", (e) => {
  startY = e.touches[0].clientY;
});

stack.addEventListener("touchend", (e) => {
  const endY = e.changedTouches[0].clientY;
  handleSwipe(startY - endY);
});

/* =========================
   СВАЙП (MOUSE)
========================= */

let mouseStart = 0;

stack.addEventListener("mousedown", (e) => {
  mouseStart = e.clientY;
});

stack.addEventListener("mouseup", (e) => {
  handleSwipe(mouseStart - e.clientY);
});

/* =========================
   ЛОГИКА СВАЙПА
========================= */

function handleSwipe(diff) {
  if (diff > 50 && currentIndex < cards.length - 1) {
    currentIndex++;
  }

  if (diff < -50 && currentIndex > 0) {
    currentIndex--;
  }

  updateStack();
}

/* =========================
   ABOUT PANEL
========================= */

function openAbout() {
  aboutPanel.classList.add("active");
}

function closeAbout() {
  aboutPanel.classList.remove("active");
}

/* =========================
   ОБНОВЛЕНИЕ
========================= */

async function forceUpdate() {
  try {
    const data = await fetchFresh();
    saveLocal(data);
    render(data);

    alert("Обновлено");
  } catch (e) {
    alert("Ошибка обновления");
  }
}

/* =========================
   СБРОС
========================= */

async function hardReset() {
  localStorage.clear();

  if ("caches" in window) {
    const keys = await caches.keys();
    for (let key of keys) {
      await caches.delete(key);
    }
  }

  location.reload();
}