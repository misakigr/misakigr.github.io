import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCardsStore } from '../store/useCardsStore'
import BarcodeView from '../components/BarcodeView'
import QRView from '../components/QRView'

const CardDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { cards, toggleFavorite, deleteCard } = useCardsStore()
  const [card, setCard] = useState(null)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    const foundCard = cards.find((c) => c.id === id)
    if (foundCard) {
      setCard(foundCard)
    } else {
      navigate('/')
    }
  }, [id, cards, navigate])

  const handleFavoriteToggle = async () => {
    if (card) {
      await toggleFavorite(card.id)
      const updatedCard = cards.find((c) => c.id === card.id)
      setCard(updatedCard)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Удалить эту карту?')) {
      await deleteCard(card.id)
      navigate('/')
    }
  }

  if (!card) {
    return null
  }

  const getTypeLabel = (type) => {
    const labels = {
      CODE128: 'Штрихкод CODE128',
      CODE39: 'Штрихкод CODE39',
      EAN13: 'Штрихкод EAN-13',
      UPC: 'Штрихкод UPC-A',
      QR: 'QR-код',
    }
    return labels[type] || type
  }

  const renderBarcode = () => {
    if (card.type === 'QR') {
      return <QRView value={card.number} size={240} />
    }
    return <BarcodeView value={card.number} type={card.type} />
  }

  return (
    <div className="detail-overlay visible" id="detailOverlay">
      <div className="detail-wrap">
        <div className="detail-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => navigate('/')}
            aria-label="Назад"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 6L9 12L15 18" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div className="detail-title">{card.name || 'Карта'}</div>
          <button
            type="button"
            className="icon-btn"
            onClick={handleFavoriteToggle}
            aria-label="Избранное"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={card.favorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path d="M7 4H17C18.1 4 19 4.9 19 6V20L12 16.5L5 20V6C5 4.9 5.9 4 7 4Z" stroke-width="1.8"/>
            </svg>
          </button>
        </div>

        <div
          className="detail-hero screen-card"
          style={{ background: `linear-gradient(135deg, ${card.color || '#1d56aa'} 0%, ${card.color ? card.color.replace(/#/, '').match(/[0-9a-f]{2}/gi).map((c, i) => Math.max(0, parseInt(c, 16) - 48).toString(16).padStart(2, '0')).join('') : '1d56aa'})` }}
        >
          <div className="brand-mark">{card.name || 'Без названия'}</div>
          <div className="card-type">{getTypeLabel(card.type)}</div>
        </div>

        <div className="barcode-panel screen-card">
          <div className="barcode-box">{renderBarcode()}</div>
          {card.number && (
            <div className="barcode-number">
              {card.type === 'QR' ? card.number : card.number.replace(/(.{4})/g, '$1 ').trim()}
            </div>
          )}
        </div>

        {card.acceptedAt && (
          <div className="info-panel screen-card">
            <h4>Принимается</h4>
            <p>{card.acceptedAt}</p>
          </div>
        )}

        <div className="menu-panel screen-card">
          {card.note && (
            <button type="button" className="menu-row">
              <div>
                <strong>О карте</strong>
                <span>{card.note}</span>
              </div>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          )}
          {card.terms && (
            <button type="button" className="menu-row">
              <div>
                <strong>Условия</strong>
                <span>{card.terms}</span>
              </div>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          )}
          {card.contacts && (
            <button type="button" className="menu-row">
              <div>
                <strong>Контакты</strong>
                <span>{card.contacts}</span>
              </div>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          )}
          <button type="button" className="menu-row" onClick={handleDelete} style={{ color: '#ff5959' }}>
            <div>
              <strong>Удалить карту</strong>
              <span>Будет удалена навсегда</span>
            </div>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default CardDetails