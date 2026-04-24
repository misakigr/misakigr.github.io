import React from 'react'

const CardItem = ({ card, onClick, onFavorite, compact = false }) => {
  const getGradient = (color) => {
    const baseColor = color || '#1d56aa'
    return `linear-gradient(135deg, ${baseColor} 0%, ${adjustColor(baseColor, -30)} 100%)`
  }

  const adjustColor = (color, amount) => {
    const hex = color.replace('#', '')
    const r = Math.min(255, Math.max(0, parseInt(hex.substr(0, 2), 16) + amount))
    const g = Math.min(255, Math.max(0, parseInt(hex.substr(2, 2), 16) + amount))
    const b = Math.min(255, Math.max(0, parseInt(hex.substr(4, 2), 16) + amount))
    return `rgb(${r}, ${g}, ${b})`
  }

  const getTypeLabel = (type) => {
    const labels = {
      CODE128: 'CODE 128',
      CODE39: 'CODE 39',
      EAN13: 'EAN-13',
      UPC: 'UPC-A',
      QR: 'QR',
    }
    return labels[type] || type
  }

  if (compact) {
    return (
      <div
        className="card-mini"
        onClick={onClick}
        style={{ background: getGradient(card.color) }}
        role="button"
        tabIndex={0}
        aria-label={`Карта ${card.name}`}
      >
        <div>
          <div className="brand-mini">{card.name?.substring(0, 12) || 'Карта'}</div>
        </div>
        <div>
          <span>{getTypeLabel(card.type)}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className="wallet-card"
      onClick={onClick}
      style={{ background: getGradient(card.color) }}
      role="button"
      tabIndex={0}
      aria-label={`Карта ${card.name}, ${card.type}`}
    >
      <div className="brand-mark">{card.name || 'Без названия'}</div>
      <div className="card-bottom">
        <div className="caption">{getTypeLabel(card.type)} карта</div>
        <div className="number">{card.number?.substring(0, 20) || 'Нет номера'}</div>
      </div>
      {card.favorite && (
        <svg
          style={{ position: 'absolute', top: '12px', right: '12px', width: '24px', height: '24px', fill: '#ffd700' }}
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )}
    </div>
  )
}

export default CardItem