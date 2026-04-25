let cardsData = [];
const cardsContainer = document.getElementById("cards");
const bgBlur = document.getElementById("bgBlur");

fetch("cards.json")
  .then(res => res.json())
  .then(data => {
    cardsData = data;
    renderCards();
    setActiveCard(0);
  });

function renderCards() {
  cardsContainer.innerHTML = "";

  cardsData.forEach((card, index) => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `<img src="${card.image}" />`;

    div.addEventListener("click", () => openModal(card.image));

    cardsContainer.appendChild(div);
  });

  observeScroll();
}

function observeScroll() {
  const cards = document.querySelectorAll(".card");

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        cards.forEach(c => c.classList.remove("active"));
        entry.target.classList.add("active");

        const img = entry.target.querySelector("img").src;
        bgBlur.style.backgroundImage = `url(${img})`;
      }
    });
  }, {
    root: cardsContainer,
    threshold: 0.6
  });

  cards.forEach(card => observer.observe(card));
}

/* 📱 FULLSCREEN */
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modalImg");

function openModal(src) {
  modal.classList.remove("hidden");
  modalImg.src = src;
}

modal.addEventListener("click", () => {
  modal.classList.add("hidden");
});
