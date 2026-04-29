Вот обобщающий, “правильный для Codex” промпт, который заставит его **не просто править код, а: проанализировать → спланировать → реализовать → проверить offline → протестировать поведение как PWA**.

---

# 📄 `wallet_codex_full_refactor_prompt.md`

````md id="codex_wallet_master"
# 🧠 Codex Task: Full Audit, Refactor, Build & Test Offline Wallet PWA

## 🎯 Goal

You are given an existing GitHub Pages project:

https://github.com/misakigr/misakigr.github.io/tree/master/Wallet

Live version:
https://misakigr.github.io/Wallet/index.html

Your task is to transform it into a **production-ready offline-first PWA wallet application** that behaves like a native iOS app.

---

# 🚨 REQUIRED WORKFLOW (STRICT)

You MUST follow this order:

## 1. 🔍 ANALYZE
- Inspect full project structure
- Identify data flow
- Identify where cards are loaded, transformed, rendered
- Identify Service Worker behavior
- Identify PWA configuration
- Identify UI structure

Output:
- list of problems
- broken assumptions
- missing offline logic
- data model inconsistencies

---

## 2. 🧠 PLAN
Create a clear step-by-step implementation plan:

Must include:
- data architecture
- offline strategy
- Service Worker caching strategy
- UI rendering flow
- state management approach
- error handling strategy

---

## 3. 🔧 IMPLEMENT (FULL REFACTOR)

### A. Data Layer (CRITICAL)

- Single source of truth: `barcodes/data.json`
- NO multiple JSON sources
- NO localStorage as primary storage
- NO runtime card creation

Required model:

```ts
Card {
  id: string
  name: string
  barcodeImage: string
  color: string
}
````

---

### B. Fix Data Loss Bugs

Ensure NO transformation removes fields like:

* barcodeImage
* color
* name

No sanitization function may drop fields.

---

### C. Rendering Layer

* render cards from data.json
* render barcode image via <img>
* add image.onerror fallback → placeholder.svg
* no broken UI states

---

### D. Service Worker (CRITICAL)

Must implement:

* full precaching of:

  * index.html
  * app.js
  * styles.css
  * manifest.json
  * barcodes/data.json
  * barcode images

* Cache First strategy for static assets

* Proper cache versioning

* Old cache cleanup on activate

* skipWaiting + clients.claim

---

### E. Offline Guarantee

App MUST:

* load with airplane mode ON
* work without internet after first load
* show all cards offline
* show all barcode images offline
* not crash under missing network

---

### F. PWA Setup

Ensure:

* manifest.json correct
* standalone mode
* icons present
* service worker registered properly

---

### G. UI Requirements (iOS-style)

* remove fake system status bar (time, LTE, etc.)
* start immediately with app content
* screens:

  * Главная (Home)
  * Каталог (Catalog)
* smooth transitions
* glassmorphism style optional

---

### H. Remove Unwanted Features

Completely remove:

* add card UI
* delete card UI
* card editing
* any runtime mutation of data

Cards are edited ONLY via GitHub data.json.

---

## 4. 🧪 TESTING (MANDATORY)

You MUST simulate and validate:

### Offline test:

* enable airplane mode
* reload app
* verify:

  * cards load
  * images load
  * no errors

### Data test:

* log state.cards[0]
* verify all fields exist

### SW test:

* verify cache hit behavior
* verify no network dependency after first load

### UI test:

* no broken states
* no "barcode unavailable" errors

---

## 5. 📊 FINAL OUTPUT

Provide:

### 1. Summary of changes

### 2. Files modified

### 3. Final architecture explanation

### 4. Known limitations (if any)

### 5. Test results

---

# ❗ SUCCESS CRITERIA

The project is considered SUCCESSFUL ONLY IF:

✔ Works fully offline
✔ No external dependencies
✔ Cards loaded only from data.json
✔ No barcode errors
✔ No missing image states
✔ No add/delete UI
✔ PWA installable
✔ Feels like native app (not website)

---

# ⚠️ FAILURE CONDITIONS

If ANY of these occur → task failed:

* barcodeImage missing or undefined
* offline mode breaks app
* multiple data sources still exist
* UI allows editing cards
* Service Worker not caching data.json
