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

// load data
fetch("cards.json")
  .then(res => res.json())
  .then(data => {
    cardsData = data.cards;
    renderCards();
    setPositionByIndex();
    updateActiveCard();
  });

// render
function renderCards() {
  cardsContainer.innerHTML = "";

  cardsData.forEach((card) => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `<img src="${card.image}" />`;

    div.addEventListener("click", () => openModal(card));

    cardsContainer.appendChild(div);
  });
}

//
// 🔥 TOUCH EVENTS
//
cardsContainer.addEventListener("touchstart", touchStart);
cardsContainer.addEventListener("touchmove", touchMove);
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

  // velocity calc
  const now = Date.now();
  velocity = (currentY - lastY) / (now - lastTime);

  lastY = currentY;
  lastTime = now;

  setTranslate(currentTranslate);
}

function touchEnd() {
  isDragging = false;

  // 🔥 решаем куда перейти
  if (velocity < -0.5) {
    currentIndex++;
  } else if (velocity > 0.5) {
    currentIndex--;
  } else {
    // fallback по позиции
    const movedBy = currentTranslate - prevTranslate;

    if (movedBy < -100) currentIndex++;
    if (movedBy > 100) currentIndex--;
  }

  // ограничения
  currentIndex = Math.max(0, Math.min(currentIndex, cardsData.length - 1));

  setPositionByIndex();
  updateActiveCard();
}

//
// 📍 POSITION LOGIC
//
function setPositionByIndex() {
  const cardHeight = 210; // высота + margin
  currentTranslate = -currentIndex * cardHeight;

  prevTranslate = currentTranslate;

  // 🔥 плавная анимация
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
// 🎯 ACTIVE CARD + BLUR
//
function updateActiveCard() {
  const cards = document.querySelectorAll(".card");

  cards.forEach((card, i) => {
    card.classList.toggle("active", i === currentIndex);
  });

  const activeCard = cards[currentIndex];
  if (activeCard) {
    const img = activeCard.querySelector("img").src;
    bgBlur.style.backgroundImage = `url(${img})`;
  }
}

//
// 📱 MODAL
//
function openModal(card) {
  modal.classList.remove("hidden");
  modalImg.src = card.image;
}

modal.addEventListener("click", () => {
  modal.classList.add("hidden");
});