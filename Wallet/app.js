let cardsData = [];

const cardsContainer = document.getElementById("cards");
const bgBlur = document.getElementById("bgBlur");

const modal = document.getElementById("modal");
const modalImg = document.getElementById("modalImg");

const menu = document.getElementById("menu");
const menuButton = document.getElementById("menuButton");

const toast = document.getElementById("toast");

const refreshBtn = document.getElementById("refreshBtn");
const clearCacheBtn = document.getElementById("clearCacheBtn");
const versionLabel = document.getElementById("versionLabel");

let currentIndex = 0;
let startY = 0;
let currentY = 0;

const CARD_HEIGHT = 210;
const CENTER_OFFSET = window.innerHeight / 2 - CARD_HEIGHT / 2;

/* 🔥 toast */
function showToast(text) {
  toast.innerText = text;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 1500);
}

/* 📦 load */
fetch("cards.json")
  .then(r => r.json())
  .then(data => {
    cardsData = data.cards;
    versionLabel.innerText = "v" + data.version;

    render();
    update();
  });

/* 🧾 render */
function render() {
  cardsContainer.innerHTML = "";

  cardsData.forEach(card => {
    const el = document.createElement("div");
    el.className = "card";

    el.innerHTML = `<img src="${card.image}" />`;

    el.onclick = () => openModal(card);

    cardsContainer.appendChild(el);
  });
}

/* 📱 swipe */
cardsContainer.addEventListener("touchstart", e => {
  startY = e.touches[0].clientY;
});

cardsContainer.addEventListener("touchend", e => {
  currentY = e.changedTouches[0].clientY;

  const diff = currentY - startY;

  if (diff < -80) currentIndex++;
  if (diff > 80) currentIndex--;

  currentIndex = Math.max(0, Math.min(currentIndex, cardsData.length - 1));

  update();
});

/* 🎯 update UI */
function update() {
  cardsContainer.style.transition = "0.3s ease";

  cardsContainer.style.transform =
    `translateY(${-currentIndex * CARD_HEIGHT + CENTER_OFFSET}px)`;

  setTimeout(() => {
    cardsContainer.style.transition = "none";
  }, 300);

  const cards = document.querySelectorAll(".card");

  cards.forEach((c, i) => {
    const offset = i - currentIndex;

    c.style.transform = `scale(${1 - Math.abs(offset) * 0.1})`;
    c.style.opacity = 1 - Math.abs(offset) * 0.3;
  });

  const active = cards[currentIndex];
  if (active) {
    bgBlur.style.backgroundImage =
      `url(${active.querySelector("img").src})`;
  }
}

/* 🔳 modal */
function openModal(card) {
  modal.classList.remove("hidden");
  modalImg.src = card.image;
}

modal.onclick = () => modal.classList.add("hidden");

/* ⋯ menu */
menuButton.onclick = () => {
  menu.classList.toggle("open");
};

/* 🔄 refresh */
refreshBtn.onclick = () => {
  location.reload();
  showToast("Обновлено");
};

/* 🧹 clear cache */
clearCacheBtn.onclick = async () => {
  localStorage.clear();

  if ("caches" in window) {
    const keys = await caches.keys();
    keys.forEach(k => caches.delete(k));
  }

  showToast("Кэш удалён");
};
