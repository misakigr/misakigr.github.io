// validation.js — Anti-Bug System for Wallet PWA
// Подключить в index.html перед app.js: <script src="validation.js"></script>

(function() {
  'use strict';

  // === СХЕМА ДАННЫХ ===
  // Определяем ОБЯЗАТЕЛЬНЫЕ поля для каждой карточки
  const CARD_SCHEMA = {
    required: ['id', 'name', 'barcodeImage'],
    optional: ['color'],
    types: {
      id: 'string',
      name: 'string', 
      barcodeImage: 'string',
      color: 'string'
    }
  };

  // === ВАЛИДАТОР ===
  window.validateCard = function(card, index) {
    const errors = [];

    // Проверка: карточка — объект
    if (!card || typeof card !== 'object') {
      throw new Error(`Card #${index}: not an object`);
    }

    // Проверка обязательных полей
    for (const field of CARD_SCHEMA.required) {
      if (!(field in card)) {
        errors.push(`Missing required field: "${field}"`);
      } else if (typeof card[field] !== CARD_SCHEMA.types[field]) {
        errors.push(`Field "${field}" must be ${CARD_SCHEMA.types[field]}, got ${typeof card[field]}`);
      } else if (String(card[field]).trim() === '') {
        errors.push(`Field "${field}" cannot be empty`);
      }
    }

    // Проверка опциональных полей (тип)
    for (const field of CARD_SCHEMA.optional) {
      if (field in card && typeof card[field] !== CARD_SCHEMA.types[field]) {
        errors.push(`Optional field "${field}" must be ${CARD_SCHEMA.types[field]}, got ${typeof card[field]}`);
      }
    }

    // Проверка: нет лишних полей (предупреждение)
    const allowedFields = [...CARD_SCHEMA.required, ...CARD_SCHEMA.optional];
    for (const key of Object.keys(card)) {
      if (!allowedFields.includes(key)) {
        console.warn(`Card #${index}: unexpected field "${key}" — will be ignored`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Card #${index} (${card.name || 'unnamed'}):\n  - ${errors.join('\n  - ')}`);
    }

    return true;
  };

  // === ВАЛИДАТОР МАССИВА ===
  window.validateCardsArray = function(cards) {
    if (!Array.isArray(cards)) {
      throw new Error('Cards data must be an array');
    }

    if (cards.length === 0) {
      throw new Error('Cards array is empty');
    }

    const validCards = [];
    const invalidIndices = [];

    cards.forEach((card, index) => {
      try {
        validateCard(card, index);
        validCards.push(card);
      } catch (error) {
        console.error('[Validation]', error.message);
        invalidIndices.push(index);
      }
    });

    if (validCards.length === 0) {
      throw new Error(`All ${cards.length} cards failed validation`);
    }

    if (invalidIndices.length > 0) {
      console.warn(`[Validation] Skipped ${invalidIndices.length} invalid cards:`, invalidIndices);
    }

    return validCards;
  };

  // === ПРОВЕРКА СТРУКТУРЫ ФАЙЛА ===
  window.validateDataFile = function(data) {
    // Поддержка двух форматов:
    // 1. Прямой массив: [{id, name, barcodeImage, color}, ...]
    // 2. Объект с полем cards: {cards: [...]}

    if (Array.isArray(data)) {
      console.log('[Validation] Data format: direct array');
      return validateCardsArray(data);
    }

    if (data && typeof data === 'object' && Array.isArray(data.cards)) {
      console.log('[Validation] Data format: {cards: [...]}');
      return validateCardsArray(data.cards);
    }

    throw new Error('Invalid data format: expected array or {cards: array}');
  };

  // === STRICT MODE ===
  // Если включён — любая ошибка валидации останавливает загрузку
  window.VALIDATION_STRICT = false; // поменяй на true для строгого режима

  console.log('[Validation] Anti-Bug System loaded');
  console.log('[Validation] Required fields:', CARD_SCHEMA.required.join(', '));
  console.log('[Validation] Optional fields:', CARD_SCHEMA.optional.join(', '));
})();
