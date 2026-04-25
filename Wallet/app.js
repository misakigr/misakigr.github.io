let cardsData = [];

const cardsContainer = document.getElementById("cards");
const bgBlur = document.getElementById("bgBlur");

// modal
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modalImg");

// swipe state
let currentIndex = 0;
let startY = 0;
let currentTranslate = 0;
let prevTranslate = 0;
let isDragging = false;

let velocity = 0;
let lastY = 0;
let lastTime = 0;

// ⚙️ настройки
const CARD_HEIGHT = 210; // подгони при необходимости

//
// 📦 LOAD DATA
//
fetch("cards.json")
  .then(res => res.json())
  .then(data => {
    cardsData = data.cards;
    renderCards();
    setPositionByIndex();
    updateActiveCard();
  });

//
// 🧾 RENDER
//
function renderCards() {
  cardsContainer.innerHTML = "";

  cardsData.forEach((card) => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `<img src="${card.image}" alt="${card.title}" />`;

    div.addEventListener("click", () => openModal(card));

    cardsContainer.appendChild(div);
  });
}

//
// 🔥 TOUCH EVENTS (физика свайпа)
//
cardsContainer.addEventListener("touchstart", touchStart, { passive: true });
cardsContainer.addEventListener("touchmove", touchMove, { passive: true });
cardsContainer.addEventListener("touchend", touchEnd);

function touchStart(e) {
  isDragging = true;

  startY = e.touches[0].clientY;

  lastY = startY;
  lastTime = Date.now();
}

function touchMove(e) {
  if (!isDragging) return;

  const currentY = e.touches[0].clientY;
  const delta = currentY - startY;

  currentTranslate = prevTranslate + delta;

  // 📈 считаем скорость
  const now = Date.now();
  const timeDiff = now - lastTime || 1;

  velocity = (currentY - lastY) / timeDiff;

  lastY = currentY;
  lastTime = now;

  setTranslate(currentTranslate);
}

function touchEnd() {
  isDragging = false;

  // 🔥 логика перелистывания
  if (velocity < -0.5) {
    currentIndex++;
  } else if (velocity > 0.5) {
    currentIndex--;
  } else {
    const movedBy = currentTranslate - prevTranslate;

    if (movedBy < -100) currentIndex++;
    if (movedBy > 100) currentIndex--;
  }

  // 📍 границы
  currentIndex = Math.max(0, Math.min(currentIndex, cardsData.length - 1));

  setPositionByIndex();
  updateActiveCard();
}

//
// 📍 POSITION
//
function setPositionByIndex() {
  currentTranslate = -currentIndex * CARD_HEIGHT;
  prevTranslate = currentTranslate;

  // плавное "долетание"
  cardsContainer.style.transition = "transform 0.35s ease";
  setTranslate(currentTranslate);

  setTimeout(() => {
    cardsContainer.style.transition = "none";
  }, 350);
}

function setTranslate(y) {
  cardsContainer.style.transform = `translateY(${y}px)`;
}

//
// 🎯 DEPTH + ACTIVE CARD (ШАГ 2)
//
function updateActiveCard() {
  const cards = document.querySelectorAll(".card");

  cards.forEach((card, i) => {
    const offset = i - currentIndex;
    const absOffset = Math.abs(offset);

    // 🔥 глубина
    const scale = Math.max(1 - absOffset * 0.1, 0.7);
    const opacity = Math.max(1 - absOffset * 0.3, 0);
    const translateY = offset * 20;

    card.style.transform = `
      translateY(${translateY}px)
      scale(${scale})
    `;

    card.style.opacity = opacity;

    card.classList.toggle("active", i === currentIndex);
  });

  // 🔵 blur фон
  const activeCard = cards[currentIndex];
  if (activeCard) {
    const img = activeCard.querySelector("img").src;
    bgBlur.style.backgroundImage = `url(${img})`;
  }
}

//
// 📱 MODAL (fullscreen)
//
function openModal(card) {
  modal.classList.remove("hidden");
  modalImg.src = card.image;
}

modal.addEventListener("click", () => {
  modal.classList.add("hidden");
});
