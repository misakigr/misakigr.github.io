import { openDB } from 'idb'

const DB_NAME = 'loyalty-wallet-db'
const STORE_NAME = 'cards'
const DB_VERSION = 1

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('favorite', 'favorite', { unique: false })
        store.createIndex('name', 'name', { unique: false })
      }
    },
  })
}

export const getDB = async () => {
  return initDB()
}

export const getAllCards = async () => {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

export const getCardById = async (id) => {
  const db = await getDB()
  return db.get(STORE_NAME, id)
}

export const addCard = async (card) => {
  const db = await getDB()
  await db.add(STORE_NAME, card)
  return card
}

export const updateCard = async (card) => {
  const db = await getDB()
  await db.put(STORE_NAME, card)
  return card
}

export const deleteCard = async (id) => {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
  return id
}

export const getFavoriteCards = async () => {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const index = tx.store.index('favorite')
  return index.getAll(IDBKeyRange.only(true))
}