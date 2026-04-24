Хорошо — тогда сразу делаем **нормальное приложение уровня production**, а не прототип. Ниже — готовый **Codex skill**, который создаёт полноценный **React + Vite + PWA + Wallet App**, уже адаптированный под **GitHub Pages (/Wallet/)** и с правильной архитектурой.

👉 Просто вставь это в `codex_wallet_skill.md` и запускай.

---

````md id="wallet-prod-skill"
# 🧠 Codex Skill: Production Loyalty Wallet (React + PWA)

## 🎯 Goal
Build a production-ready Progressive Web App (PWA) for storing loyalty cards (barcode/QR), similar to Apple Wallet / Stocard.

The app MUST:
- Be built with React + Vite
- Work offline (Service Worker)
- Be deployable to GitHub Pages under `/Wallet/`
- Support adding/removing/editing cards
- Store data locally (IndexedDB)
- Render barcodes and QR codes
- Have modern mobile-first UI
- Be installable as a PWA

---

## 📁 Project Setup

### Create project
```bash
npm create vite@latest loyalty-wallet -- --template react
cd loyalty-wallet
npm install
````

### Install dependencies

```bash
npm install zustand idb localforage uuid
npm install react-router-dom
npm install @mui/material @emotion/react @emotion/styled
npm install html5-qrcode
npm install jsbarcode qrcode.react
npm install vite-plugin-pwa gh-pages
```

---

## ⚙️ Vite Config (IMPORTANT for GitHub Pages)

Edit `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/Wallet/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Loyalty Wallet',
        short_name: 'Wallet',
        start_url: '/Wallet/',
        scope: '/Wallet/',
        display: 'standalone',
        background_color: '#121212',
        theme_color: '#121212',
        icons: [
          {
            src: '/Wallet/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/Wallet/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
```

---

## 🧱 Architecture

```
src/
 ├── components/
 │   ├── CardItem.jsx
 │   ├── BarcodeView.jsx
 │   ├── AddCardModal.jsx
 │   ├── Scanner.jsx
 │
 ├── pages/
 │   ├── Home.jsx
 │   ├── CardDetails.jsx
 │
 ├── store/
 │   ├── useCardsStore.js
 │
 ├── db/
 │   ├── db.js
 │
 ├── App.jsx
 ├── main.jsx
```

---

## 💾 IndexedDB (db/db.js)

```js
import { openDB } from 'idb'

export const db = await openDB('wallet-db', 1, {
  upgrade(db) {
    db.createObjectStore('cards', { keyPath: 'id' })
  }
})
```

---

## 🧠 State Management (Zustand)

```js
import { create } from 'zustand'
import { db } from '../db/db'

export const useCardsStore = create((set) => ({
  cards: [],

  loadCards: async () => {
    const all = await db.getAll('cards')
    set({ cards: all })
  },

  addCard: async (card) => {
    await db.put('cards', card)
    set(state => ({ cards: [...state.cards, card] }))
  },

  deleteCard: async (id) => {
    await db.delete('cards', id)
    set(state => ({ cards: state.cards.filter(c => c.id !== id) }))
  }
}))
```

---

## 📇 Card Model

```js
{
  id: uuid(),
  name: "Store",
  barcode: "123456789",
  type: "CODE128",
  color: "#222",
  favorite: false
}
```

---

## 📦 Barcode Component

```jsx
import JsBarcode from 'jsbarcode'
import { useEffect, useRef } from 'react'

export default function BarcodeView({ value }) {
  const ref = useRef()

  useEffect(() => {
    JsBarcode(ref.current, value, { format: 'CODE128' })
  }, [value])

  return <svg ref={ref}></svg>
}
```

---

## 📷 QR Component

```jsx
import QRCode from 'qrcode.react'

export default function QRView({ value }) {
  return <QRCode value={value} size={200} />
}
```

---

## 📱 Add Card (Manual + Scanner)

Use:

* html5-qrcode for camera scanning
* modal form for manual input

---

## 🏠 Home Page

Must include:

* Search bar
* Favorites section
* Cards grid
* Floating "Add" button

---

## 🎨 UI Rules

* Dark theme (#121212)
* Rounded cards
* Smooth shadows
* Mobile-first layout
* Bottom navigation

---

## 🔌 Offline Support

Handled automatically by `vite-plugin-pwa`

Ensure:

```js
registerType: 'autoUpdate'
```

---

## 🚀 GitHub Pages Deploy

### package.json

```json
"homepage": "https://misakigr.github.io/Wallet/",
"scripts": {
  "deploy": "vite build && gh-pages -d dist"
}
```

### Deploy

```bash
npm run deploy
```

---

## 🧪 Testing Checklist

* App installs as PWA
* Works offline
* Cards persist after reload
* Barcode renders correctly
* Scanner works
* Deploy works at `/Wallet/`

---

## 🔄 Updates

Add UI button:

* "Update app" (calls `window.location.reload()` after SW update)

---

## 📌 Optional Enhancements

* Import/export JSON
* Cloud sync (GitHub Gist)
* PIN / FaceID (WebAuthn)
* Categories for cards
* Drag & drop sorting

---

## 🧠 Codex Instructions

You MUST:

1. Generate full working project
2. Implement all components
3. Ensure build works
4. Ensure GitHub Pages compatibility
5. Test offline mode

Do NOT:

* Skip implementation
* Leave TODOs
* Ask unnecessary questions

---

## ✅ Final Result

A production-ready PWA wallet that:

* Works like a real app
* Stores cards persistently
* Works offline
* Deploys on GitHub Pages

```

---


# 🔥 ДОПОЛНЕНИЕ ДЛЯ `codex_wallet_skill.md`

👉 Просто **добавь этот блок в конец файла**

````md
---

## 🚨 CRITICAL FIX: QR CODE GENERATION (MUST BE CORRECT)

The current QR code generation is WRONG and produces invalid codes.

Symptoms:
- Missing or broken finder patterns (corner squares)
- Distorted or diagonal patterns
- Not scannable by real devices

---

## 📌 Root Causes

Typical mistakes that MUST be fixed:

1. ❌ Using wrong library or canvas rendering incorrectly  
2. ❌ Missing quiet zone (margin)  
3. ❌ Encoding wrong data format  
4. ❌ CSS distortion (scale / transform)  
5. ❌ Rendering low resolution bitmap  

---

## ✅ REQUIRED IMPLEMENTATION

### Use ONLY reliable QR libraries:

- React:
```bash
npm install qrcode.react
````

* OR vanilla:

```bash
npm install qrcode
```

---

## ✅ React Implementation (MANDATORY)

```jsx
import QRCode from 'qrcode.react'

export default function QRView({ value }) {
  return (
    <QRCode
      value={value}
      size={240}
      level="M"
      includeMargin={true}
      bgColor="#FFFFFF"
      fgColor="#000000"
      renderAs="svg"
    />
  )
}
```

---

## ✅ Vanilla JS Implementation

```js
import QRCode from 'qrcode'

const canvas = document.getElementById('qr')

QRCode.toCanvas(canvas, value, {
  width: 240,
  margin: 4,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  },
  errorCorrectionLevel: 'M'
})
```

---

## ⚠️ IMPORTANT RULES (STRICT)

### 1. Quiet Zone (MANDATORY)

* Minimum margin = 4 modules
* DO NOT remove margin

👉 Without quiet zone QR will NOT scan ([QRWorks][1])

---

### 2. No CSS Distortion

DO NOT use:

```css
transform: scale()
width != height
```

QR must stay perfectly square
Distortion breaks scanning ([adobe.com][2])

---

### 3. High Contrast ONLY

* Black (#000000) on white (#FFFFFF)
* NO gradients
* NO transparency

Low contrast breaks scanning ([ContentQR][3])

---

### 4. Correct Data Format

DO NOT:

```js
"E70 080 006 026 986 20"
```

USE:

```js
"E7008000602698620"
```

👉 Spaces change encoding → different QR

---

### 5. Minimum Size

* At least 200px
* Recommended: 240–300px

Too small = unreadable ([ContentQR][3])

---

### 6. Error Correction

Use:

```js
level = "M"
```

Why:

* Best balance (15% recovery) ([QRWorks][1])

---

## 🚫 FORBIDDEN

Codex MUST NOT:

* Generate QR manually (matrix logic)
* Use random canvas drawing
* Apply CSS filters
* Overlay UI elements on QR
* Crop QR edges

---

## 🧪 TEST REQUIREMENT (MANDATORY)

After implementation:

1. Generate QR
2. Scan with:

   * iPhone camera
   * Android camera
3. Must scan instantly

If not → FIX until it works

---

## ✅ EXPECTED RESULT

QR must:

* Have 3 clear corner squares
* Be perfectly square
* Scan in <1 second
* Match original wallet QR visually

---

