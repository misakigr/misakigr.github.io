let cardsData = [];

const cardsContainer = document.getElementById("cards");
const bgBlur = document.getElementById("bgBlur");

// modal
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modalImg");

// load data
fetch("cards.json")
  .then(res => res.json())
  .then(data => {
    cardsData = data.cards;
    renderCards();
    initObserver();
  });

// render cards
function renderCards() {
  cardsContainer.innerHTML = "";

  cardsData.forEach((card, index) => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <img src="${card.image}" alt="${card.title}" />
    `;

    // tap → open fullscreen
    div.addEventListener("click", () => openModal(card));

    cardsContainer.appendChild(div);
  });
}

// blur + active card tracking (Apple Wallet style)
function initObserver() {
  const cards = document.querySelectorAll(".card");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {

          cards.forEach(c => c.classList.remove("active"));
          entry.target.classList.add("active");

          const img = entry.target.querySelector("img").src;
          bgBlur.style.backgroundImage = `url(${img})`;
        }
      });
    },
    {
      root: cardsContainer,
      threshold: 0.6
    }
  );

  cards.forEach(card => observer.observe(card));
}

//
// 🔥 ОБНОВЛЁННАЯ openModal()
// теперь работает с объектом card
//
function openModal(card) {
  modal.classList.remove("hidden");

  // основная картинка
  modalImg.src = card.image;

  // можно расширять дальше:
  // например будущий Wallet UI:
  // title, subtitle, barcode, qr

  console.log("Opened card:", card);
}

// close modal
modal.addEventListener("click", () => {
  modal.classList.add("hidden");
});
