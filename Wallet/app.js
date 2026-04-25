let cardsData = [];

const cardsContainer = document.getElementById("cards");
const bgBlur = document.getElementById("bgBlur");

const modal = document.getElementById("modal");
const modalImg = document.getElementById("modalImg");

const menu = document.getElementById("menu");
const menuButton = document.getElementById("menuButton");

let currentIndex = 0;
let startY = 0;
let currentY = 0;

const CARD_HEIGHT = 210;

/* LOAD */
fetch("cards.json")
  .then(r => r.json())
  .then(data => {
    cardsData = data.cards;
    render();
    update();
  });

/* RENDER */
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

/* SWIPE */
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

/* UPDATE */
function update() {
  cardsContainer.style.transition = "0.3s ease";
  cardsContainer.style.transform =
    `translateY(${-currentIndex * CARD_HEIGHT}px)`;

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

/* MODAL */
function openModal(card) {
  modal.classList.remove("hidden");
  modalImg.src = card.image;
}

modal.onclick = () => modal.classList.add("hidden");

/* MENU */
menuButton.onclick = () => {
  menu.classList.toggle("open");
};
