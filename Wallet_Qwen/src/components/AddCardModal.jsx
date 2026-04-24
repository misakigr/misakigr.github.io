import React, { useState, useRef } from 'react'

const AddCardModal = ({ onClose, onAdd, onImport, existingCard = null }) => {
  const [activeTab, setActiveTab] = useState('manual')
  const [scanResult, setScanResult] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [formData, setFormData] = useState({
    name: existingCard?.name || '',
    number: existingCard?.number || '',
    type: existingCard?.type || 'CODE128',
    color: existingCard?.color || '#1d56aa',
    acceptedAt: existingCard?.acceptedAt || '',
    note: existingCard?.note || '',
    terms: existingCard?.terms || '',
    contacts: existingCard?.contacts || '',
    favorite: existingCard?.favorite || false,
  })
  const fileInputRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cardData = {
      ...formData,
      number: formData.number.replace(/\s/g, ''),
    }
    onAdd(cardData)
  }

  const handleImportText = () => {
    try {
      const parsed = JSON.parse(document.getElementById('importTextarea').value)
      if (Array.isArray(parsed)) {
        onImport(parsed)
        setActiveTab('manual')
      } else if (parsed && typeof parsed === 'object') {
        onImport([parsed])
        setActiveTab('manual')
      }
    } catch (error) {
      alert('Ошибка парсинга JSON: ' + error.message)
    }
  }

  const handleFileImport = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result)
          if (Array.isArray(parsed)) {
            onImport(parsed)
          } else if (parsed && typeof parsed === 'object') {
            onImport([parsed])
          }
          setActiveTab('manual')
        } catch (error) {
          alert('Ошибка чтения файла: ' + error.message)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleScan = () => {
    const scannerScript = document.getElementById('html5-qrcode-script')
    if (!scannerScript) {
      const script = document.createElement('script')
      script.id = 'html5-qrcode-script'
      script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
      script.onload = () => {
        setIsScanning(true)
        document.getElementById('scannerSheet').classList.add('visible')
      }
      document.head.appendChild(script)
    } else {
      setIsScanning(true)
      document.getElementById('scannerSheet').classList.add('visible')
    }
  }

  const stopScan = () => {
    setIsScanning(false)
    document.getElementById('scannerSheet').classList.remove('visible')
  }

  const applyScanResult = () => {
    const input = document.getElementById('scanResult')
    if (input && input.value) {
      setFormData((prev) => ({ ...prev, number: input.value }))
      setScanResult(input.value)
      document.getElementById('addSheet').classList.add('visible')
      document.getElementById('scannerSheet').classList.remove('visible')
    }
  }

  const renderManualTab = () => (
    <form onSubmit={handleSubmit} className="form-grid">
      <div className="field">
        <label htmlFor="cardName">Название магазина</label>
        <input
          id="cardName"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          type="text"
          placeholder="Например, Лента"
          required
        />
      </div>
      <div className="field-inline">
        <div className="field">
          <label htmlFor="cardNumber">Номер карты</label>
          <input
            id="cardNumber"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            type="text"
            placeholder="1234 5678 9012"
          />
        </div>
        <div className="field">
          <label htmlFor="cardType">Тип кода</label>
          <select
            id="cardType"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <option value="CODE128">CODE128</option>
            <option value="QR">QR</option>
            <option value="CODE39">CODE39</option>
            <option value="EAN13">EAN13</option>
            <option value="UPC">UPC</option>
          </select>
        </div>
      </div>
      <div className="field-inline">
        <div className="field">
          <label htmlFor="cardColor">Цвет карты</label>
          <input
            id="cardColor"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            type="color"
          />
        </div>
        <div className="field">
          <label htmlFor="cardUse">Подсказка на кассе</label>
          <input
            id="cardUse"
            value={formData.acceptedAt}
            onChange={(e) => setFormData({ ...formData, acceptedAt: e.target.value })}
            type="text"
            placeholder="Покажите карту кассиру"
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="cardNote">Описание</label>
        <textarea
          id="cardNote"
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          placeholder="Баллы, условия, преимущества"
        />
      </div>
      <div className="field">
        <label htmlFor="cardTerms">Условия</label>
        <textarea
          id="cardTerms"
          value={formData.terms}
          onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
          placeholder="Как начисляются баллы, сроки действия"
        />
      </div>
      <div className="field">
        <label htmlFor="cardContacts">Контакты</label>
        <input
          id="cardContacts"
          value={formData.contacts}
          onChange={(e) => setFormData({ ...formData, contacts: e.target.value })}
          type="text"
          placeholder="+7 800 ... или сайт"
        />
      </div>
      <label className="toggle">
        <span>Добавить в часто используемые</span>
        <input
          id="cardFavorite"
          checked={formData.favorite}
          onChange={(e) => setFormData({ ...formData, favorite: e.target.checked })}
          type="checkbox"
        />
      </label>
      <div className="button-row">
        <button type="button" className="secondary-btn" onClick={onClose}>
          Отмена
        </button>
        <button type="submit" className="submit-btn">
          Сохранить
        </button>
      </div>
    </form>
  )

  const renderScanTab = () => (
    <div className="form-grid">
      <p className="import-note">
        Наведите камеру на штрихкод или QR-код для автоматического распознавания.
      </p>
      <button type="button" className="submit-btn" onClick={handleScan} disabled={isScanning}>
        {isScanning ? 'Сканер запущен...' : 'Открыть камеру'}
      </button>
      <button type="button" className="secondary-btn" onClick={stopScan} disabled={!isScanning}>
        Остановить сканирование
      </button>
      <div className="field">
        <label htmlFor="scanResult">Результат сканирования</label>
        <input
          id="scanResult"
          value={scanResult}
          onChange={(e) => setScanResult(e.target.value)}
          type="text"
          placeholder="Результат появится здесь"
        />
      </div>
      <button type="button" className="secondary-btn" onClick={() => applyScanResult()}>
        Применить к номеру карты
      </button>
    </div>
  )

  const renderImportTab = () => (
    <div className="form-grid">
      <div className="field">
        <label htmlFor="importTextarea">JSON с картами</label>
        <textarea
          id="importTextarea"
          placeholder='[{"name":"Новая карта","number":"1234567890123","type":"CODE128"}]'
        />
      </div>
      <div className="button-row">
        <button type="button" className="secondary-btn" onClick={() => fileInputRef.current?.click()}>
          Выбрать файл
        </button>
        <button type="button" className="submit-btn" onClick={handleImportText}>
          Импортировать
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleFileImport} />
      <p className="import-note">
        Поддерживаются массивы объектов с полями: name, number, type, color, note, terms, contacts,
        favorite.
      </p>
    </div>
  )

  return (
    <>
      <div className="sheet-backdrop" id="sheetBackdrop" onClick={onClose}></div>
      <aside className="sheet" id="addSheet" aria-hidden="false">
        <div className="sheet-grip"></div>
        <div className="sheet-head">
          <h3>{existingCard ? 'Редактировать' : 'Добавить'} карту</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div className="sheet-tabs">
          <button
            type="button"
            className={`sheet-tab ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            Ручной ввод
          </button>
          <button
            type="button"
            className={`sheet-tab ${activeTab === 'scan' ? 'active' : ''}`}
            onClick={() => setActiveTab('scan')}
          >
            Камера
          </button>
          <button
            type="button"
            className={`sheet-tab ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            Импорт JSON
          </button>
        </div>

        <div className={`tab-panel ${activeTab === 'manual' ? 'active' : ''}`}>
          {renderManualTab()}
        </div>
        <div className={`tab-panel ${activeTab === 'scan' ? 'active' : ''}`}>
          {renderScanTab()}
        </div>
        <div className={`tab-panel ${activeTab === 'import' ? 'active' : ''}`}>
          {renderImportTab()}
        </div>
      </aside>

      <section className="scanner-sheet" id="scannerSheet">
        <div className="sheet-head">
          <h3>Сканирование</h3>
          <button type="button" className="icon-btn" onClick={stopScan} aria-label="Закрыть сканер">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
            </svg>
          </button>
        </div>
        <p className="scanner-hint">Наведи камеру на штрихкод. Результат появится автоматически.</p>
        <div className="scanner-frame">
          <div id="scannerRegion"></div>
        </div>
        <button type="button" className="secondary-btn" onClick={applyScanResult}>
          Использовать результат
        </button>
      </section>
    </>
  )
}

export default AddCardModal