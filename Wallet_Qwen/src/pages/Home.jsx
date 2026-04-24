import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CardItem from '../components/CardItem'
import AddCardModal from '../components/AddCardModal'
import { useCardsStore } from '../store/useCardsStore'

const Home = () => {
  const navigate = useNavigate()
  const { cards, loadCards, toggleFavorite } = useCardsStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadCards()
  }, [loadCards])

  const favoriteCards = cards.filter((c) => c.favorite)
  const filteredCards = cards.filter((card) => {
    const matchesSearch = card.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         card.number?.includes(searchQuery) ||
                         card.acceptedAt?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === 'all' ? true : filter === 'favorite' ? card.favorite : true
    return matchesSearch && matchesFilter
  })

  const handleCardClick = (card) => {
    navigate(`/card/${card.id}`)
  }

  const handleFavoriteToggle = async (e, cardId) => {
    e.stopPropagation()
    await toggleFavorite(cardId)
  }

  const handleQuickAdd = () => {
    setShowAddModal(true)
  }

  const handleCatalogClick = () => {
    navigate('/catalog')
  }

  return (
    <div className="page active" data-page="home">
      <div className="screen-header center">
        <div className="screen-title">Главная</div>
        <button type="button" className="icon-btn" aria-label="Уведомления">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 4C9.79 4 8 5.79 8 8V10.29C8 11.04 7.79 11.78 7.39 12.41L6.15 14.35C5.52 15.34 6.23 16.66 7.41 16.66H16.58C17.77 16.66 18.48 15.34 17.85 14.35L16.61 12.41C16.21 11.78 16 11.04 16 10.29V8C16 5.79 14.21 4 12 4ZM12 20C13.11 20 14 19.11 14 18H10C10 19.11 10.89 20 12 20Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="search-wrap">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" stroke-width="1.8"/>
          <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        <input
          className="search-input"
          type="search"
          placeholder="Найти карту, скидку"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="hero-row">
        <div className="quick-actions">
          <button type="button" className="quick-tile" onClick={() => navigate('/catalog')}>
            <svg width="54" height="54" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.95)"/>
              <path d="M9 5H5C4.45 5 4 5.45 4 6V10C4 10.55 4.45 11 5 11H9C9.55 11 10 10.55 10 10V6C10 5.45 9.55 5 9 5Z" stroke="#394058" stroke-width="1.7"/>
              <path d="M19 5H15C14.45 5 14 5.45 14 6V10C14 10.55 14.45 11 15 11H19C19.55 11 20 10.55 20 10V6C20 5.45 19.55 5 19 5Z" stroke="#394058" stroke-width="1.7"/>
              <path d="M9 13H5C4.45 13 4 13.45 4 14V18C4 18.55 4.45 19 5 19H9C9.55 19 10 18.55 10 18V14C10 13.45 9.55 13 9 13Z" stroke="#394058" stroke-width="1.7"/>
              <path d="M19 13H15C14.45 13 14 13.45 14 14V18C14 18.55 14.45 19 15 19H19C19.55 19 20 18.55 20 18V14C20 13.45 19.55 13 19 13Z" stroke="#394058" stroke-width="1.7"/>
            </svg>
            <strong>Каталог</strong>
          </button>
          <button type="button" className="quick-tile" onClick={() => setShowAddModal(true)}>
            <svg width="54" height="54" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.95)"/>
              <path d="M12 7V17M7 12H17" stroke="#394058" stroke-width="1.9" stroke-linecap="round"/>
            </svg>
            <strong>Карта</strong>
          </button>
        </div>

        <div className="promo-panel screen-card" onClick={handleCatalogClick}>
          <div className="glow"></div>
          <h3>Рекомендации для вас 🙌</h3>
          <p>Собрали популярные карты магазинов для вашего региона.</p>
          <button type="button" className="pill-btn">Перейти</button>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>Часто используете</h2>
          <small>{favoriteCards.length} карт</small>
        </div>
        <div className="frequent-grid">
          {favoriteCards.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '28px 22px' }}>
              Нет избранных карт. Добавьте карты и пометьте их звездочкой.
            </div>
          ) : (
            favoriteCards.slice(0, 6).map((card) => (
              <CardItem
                key={card.id}
                card={card}
                compact
                onClick={() => handleCardClick(card)}
                onFavorite={(e) => handleFavoriteToggle(e, card.id)}
              />
            ))
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Все карты</h2>
          <small>{filteredCards.length} позиций</small>
        </div>
        <div className="wallet-grid">
          {filteredCards.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              Карты пока не добавлены. Нажмите на кнопку с плюсом, чтобы создать первую карту.
            </div>
          ) : (
            filteredCards.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                onClick={() => handleCardClick(card)}
                onFavorite={(e) => handleFavoriteToggle(e, card.id)}
              />
            ))
          )}
        </div>
      </section>

      <button
        type="button"
        className="floating-add"
        onClick={handleQuickAdd}
        aria-label="Добавить карту"
      >
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>

      {showAddModal && (
        <AddCardModal
          onClose={() => setShowAddModal(false)}
          onAdd={async (cardData) => {
            await useCardsStore.getState().addCard(cardData)
            setShowAddModal(false)
          }}
          onImport={async (importedCards) => {
            await useCardsStore.getState().importCards(importedCards)
            setShowAddModal(false)
          }}
        />
      )}
    </div>
  )
}

export default Home