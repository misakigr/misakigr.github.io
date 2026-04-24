import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  getAllCards as getAllCardsDB,
  addCard as addCardDB,
  updateCard as updateCardDB,
  deleteCard as deleteCardDB,
  getFavoriteCards as getFavoriteCardsDB,
} from '../db/db'

export const useCardsStore = create(
  persist(
    (set, get) => ({
      cards: [],
      loading: false,
      error: null,

      loadCards: async () => {
        set({ loading: true, error: null })
        try {
          const cards = await getAllCardsDB()
          set({ cards, loading: false })
        } catch (error) {
          set({ error: error.message, loading: false })
        }
      },

      addCard: async (cardData) => {
        set({ loading: true, error: null })
        try {
          const card = {
            ...cardData,
            id: crypto.randomUUID(),
            favorite: cardData.favorite || false,
            createdAt: new Date().toISOString(),
          }
          await addCardDB(card)
          set((state) => ({ cards: [...state.cards, card], loading: false }))
          return card
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      updateCard: async (id, updates) => {
        set({ loading: true, error: null })
        try {
          const existingCard = get().cards.find((c) => c.id === id)
          const updatedCard = { ...existingCard, ...updates }
          await updateCardDB(updatedCard)
          set((state) => ({
            cards: state.cards.map((c) => (c.id === id ? updatedCard : c)),
            loading: false,
          }))
          return updatedCard
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      deleteCard: async (id) => {
        set({ loading: true, error: null })
        try {
          await deleteCardDB(id)
          set((state) => ({
            cards: state.cards.filter((c) => c.id !== id),
            loading: false,
          }))
          return id
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      toggleFavorite: async (id) => {
        set({ loading: true, error: null })
        try {
          const existingCard = get().cards.find((c) => c.id === id)
          const updatedCard = { ...existingCard, favorite: !existingCard.favorite }
          await updateCardDB(updatedCard)
          set((state) => ({
            cards: state.cards.map((c) => (c.id === id ? updatedCard : c)),
            loading: false,
          }))
          return updatedCard
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      getFavoriteCards: () => {
        return get().cards.filter((c) => c.favorite)
      },

      importCards: async (cardsData) => {
        set({ loading: true, error: null })
        try {
          const newCards = await Promise.all(
            cardsData.map(async (cardData) => {
              const card = {
                ...cardData,
                id: crypto.randomUUID(),
                favorite: cardData.favorite || false,
                createdAt: new Date().toISOString(),
              }
              await addCardDB(card)
              return card
            })
          )
          set((state) => ({ cards: [...state.cards, ...newCards], loading: false }))
          return newCards
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },
    }),
    {
      name: 'loyalty-wallet-storage',
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          const str = localStorage.getItem(name)
          return str ? JSON.parse(str) : null
        },
        setItem: async (name, value) => {
          localStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: async (name) => {
          localStorage.removeItem(name)
        },
      })),
      partialize: (state) => ({ cards: state.cards }),
    }
  )
)