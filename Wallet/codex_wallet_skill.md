Here is your **full prompt/skill translated into English**, formatted as a single **copy-ready code block** for `codex_wallet_skill.md`:

```md
# 🧠 Codex Skill: Loyalty Cards Web Wallet (PWA)

## 🎯 Goal
Build a full-featured web application (PWA) — a loyalty cards wallet (similar to Stocard / Wallet apps), which:
- Runs in a browser and can be installed as a PWA (iOS, Android, Desktop)
- Can be deployed via GitHub Pages
- Works offline (via Service Worker)
- Allows adding, storing, and displaying loyalty cards (barcodes / QR codes)
- Has a modern UI (based on provided screenshots)
- Stores data locally (IndexedDB / LocalStorage)
- Can recover automatically after cache reset

---

## 📁 Working Directory
Use the local project folder:
```

/workspace/loyalty-wallet

````

If it does not exist — create it.

---

## ⚙️ Environment Setup

### 1. Check and install tools
Ensure the following are installed:
- Node.js >= 18
- npm >= 9
- Git

Install them if missing.

### 2. Initialize project
Create a Vite + React project:
```bash
npm create vite@latest loyalty-wallet -- --template react
cd loyalty-wallet
npm install
````

### 3. Install dependencies

```bash
npm install
npm install zustand idb localforage
npm install @mui/material @emotion/react @emotion/styled
npm install react-router-dom
npm install quagga html5-qrcode
npm install vite-plugin-pwa
```

---

## 🏗️ Project Structure

```
src/
 ├── components/
 │   ├── CardItem.jsx
 │   ├── BarcodeView.jsx
 │   ├── AddCardModal.jsx
 │
 ├── pages/
 │   ├── Home.jsx
 │   ├── CardDetails.jsx
 │
 ├── store/
 │   ├── useCardsStore.js
 │
 ├── utils/
 │   ├── barcode.js
 │   ├── storage.js
 │
 ├── App.jsx
 ├── main.jsx
 └── service-worker.js
```

---

## 🧩 Core Features

### 📌 1. Home Screen (like screenshots)

* Search bar
* "Frequently used" section
* All cards list
* "Add card" button

### 📌 2. Card Model

Each card includes:

* Store name
* Color / background
* Barcode or QR
* Card number
* Additional info

### 📌 3. Card View Screen

* Large barcode display
* Card number
* Delete button
* Extra menu (details, conditions, contacts)

---

## 📷 Barcode Handling

Use:

* JsBarcode or Canvas

Support:

* EAN-13
* CODE128
* QR

---

## 💾 Data Storage

Use:

* IndexedDB (via `idb` or `localforage`)

Structure:

```json
{
  "id": "uuid",
  "name": "Store Name",
  "barcode": "123456789",
  "type": "CODE128",
  "color": "#0044cc",
  "favorite": true
}
```

---

## 🔌 Offline Mode (IMPORTANT)

Configure `vite-plugin-pwa`:

```js
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.destination === 'document',
        handler: 'NetworkFirst'
      }
    ]
  }
})
```

Requirements:

* Online → load from GitHub
* Offline → load from cache
* Cache cleared → auto re-download

---

## 📱 PWA Requirements

Create:

* `manifest.json`
* Icons (192x192, 512x512)

Example:

```json
{
  "name": "Loyalty Wallet",
  "short_name": "Wallet",
  "display": "standalone",
  "start_url": "/",
  "background_color": "#121212",
  "theme_color": "#121212"
}
```

---

## 🎨 UI / UX (IMPORTANT)

Follow screenshots:

* Dark theme
* Large cards
* Rounded corners
* Soft shadows
* Bottom navigation

Sections:

* Home
* Catalog
* Benefits
* More

---

## ➕ Add Card Feature

Implement:

* Manual input
* Camera scan (html5-qrcode)
* Import from JSON

---

## 🚀 Deployment (GitHub Pages)

1. Create repository
2. Install:

```bash
npm install gh-pages
```

3. Update `package.json`:

```json
"scripts": {
  "deploy": "vite build && gh-pages -d dist"
}
```

4. Run:

```bash
npm run deploy
```

---

## 🔄 Auto Update

Implement:

* Service Worker updates
* "Update app" button

---

## 🧪 Testing

Verify:

* Offline functionality
* PWA install (especially iOS Safari)
* Add/remove cards
* Barcode rendering

---

## 📌 Optional Features

* Sync via GitHub Gist
* Import/export cards
* Drag & drop sorting
* FaceID / PIN (WebAuthn)

---

## 🧠 Codex Behavior

You must:

1. Create project
2. Install dependencies
3. Write full implementation
4. Configure PWA
5. Test functionality
6. Prepare deployment

Do not ask unnecessary questions — execute step by step.

---

## ✅ Final Result

A complete application that:

* Runs locally
* Deploys to GitHub Pages
* Works as a PWA
* Matches the UX from screenshots

```

---

If you want, I can next:
- :contentReference[oaicite:0]{index=0}  
- or :contentReference[oaicite:1]{index=1}
```
