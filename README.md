# Hospital Implant Expiration Tracker

A fast, foolproof web app for materials technicians at a hospital loading dock.
A tech photographs implant/biologic packaging, **Claude Vision** reads the
product name, expiration date, and lot number, and the entry — with a quantity —
is appended to a shared **Google Sheet**.

> Built to be operated with gloved hands on a laptop or tablet: large buttons,
> high contrast, no fiddly inputs, and ~10–15 seconds per batch.

---

## Features

- 📷 **Webcam capture** — large green *CAPTURE PHOTO* button, live preview,
  retake/confirm, and multi-camera selection.
- 🤖 **Claude Vision extraction** — returns `{ product, expiration_date, lot_number }`
  plus a confidence level and a blurry-photo flag. All fields are editable.
- 🔢 **Gloved-hand quantity input** — big +/- steppers, batch presets, and a
  configurable unit type (each/box/case/set/vial).
- 🔁 **Duplicate detection** — same product + lot + expiration prompts you to
  *add more units* instead of creating a duplicate row.
- 📊 **Google Sheets logging** — auto-appends `Timestamp, Product, Expiration,
  Lot, Quantity, Unit, Days Until Expiration, Status, Location`, with the Status
  column color-coded (GREEN > 60d, YELLOW 30–60d, RED < 30d / expired).
- 🧭 **Dashboard** — total units, expiring-soon summary, recent items,
  search/filter, and group-by-expiration.
- 🛟 **Never loses data** — every entry is cached in `localStorage` and synced to
  the sheet; failed writes are queued and retried automatically when back online.
- ⚙️ **Setup wizard + Settings** — API key + Sheet connection with **Test**
  buttons, alert threshold, unit types, camera, dark mode, high contrast, and
  font scaling.

---

## Architecture

```
React (Vite) frontend  ──▶  /api/vision  ──▶  Claude Vision (Anthropic)
                        └─▶  /api/sheets  ──▶  Google Sheets API (service account)
```

- **Frontend:** React 18 + Vite + Tailwind CSS, `axios` for HTTP.
- **Serverless functions** (`/api`, deployed on Vercel) keep API credentials off
  the client and avoid browser CORS limitations:
  - `api/vision.js` — calls Claude Vision and returns structured JSON.
  - `api/sheets.js` — authenticates a Google **service account** and
    appends/reads rows, creating the tab, header, and color rules on first use.
- **No database** — the user's own Google Sheet is the source of truth, with a
  bounded `localStorage` cache (last 50 entries) as an offline fallback.

Credentials can come from **server environment variables** (recommended for a
locked-down shared deployment) **or** from the in-app Settings page (stored only
in the browser). Either works; env vars take precedence when set.

---

## Quick start (local)

```bash
npm install

# Run the Vite dev server + serverless functions together:
npx vercel dev          # serves the app and /api on one origin (recommended)

# — or — frontend only (then point the Vite proxy at your API host):
npm run dev
```

Open http://localhost:3000 (with `vercel dev`) and complete the in-app setup
wizard, or pre-configure via environment variables (see below).

---

## Configuration

Copy `.env.example` to `.env` (for `vercel dev`) or set these as **Vercel
Environment Variables** in production:

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claude Vision API key ([console](https://console.anthropic.com/settings/keys)). |
| `CLAUDE_VISION_MODEL` | *(optional)* override the vision model. |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Service account key JSON (raw or base64). |
| `GOOGLE_SHEET_ID` | Target spreadsheet ID. |
| `GOOGLE_SHEET_TAB` | *(optional)* tab name, defaults to `Inventory`. |

### Google Sheets setup (one time)

1. In Google Cloud, create a project and **enable the Google Sheets API**.
2. Create a **service account** and download its JSON key.
3. Put the JSON in `GOOGLE_SERVICE_ACCOUNT_JSON` (or paste it in Settings).
4. Open your Google Sheet → **Share** → add the service account's
   `client_email` with **Editor** access.
5. Paste the Sheet URL in Settings (the app extracts the ID automatically).

The app creates the header row and color-coding the first time it writes.

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, **Import** the repo (framework auto-detected as Vite).
3. Add the environment variables above.
4. Deploy. The `vercel.json` already maps `/api/*` to serverless functions and
   serves the SPA for all other routes.

---

## Error handling & edge cases

- **Vision fails / unreadable** → automatic fallback to a manual-entry form.
- **Blurry photo** → flagged with a warning banner; verify or retake.
- **Unparseable date** → inline error; the field stays editable and a wide range
  of formats (MM/DD/YYYY, M/D/YY, `AUG 2026`, `08/2026`, ISO) are normalized.
- **Quantity > 100** → requires an explicit confirmation checkbox.
- **Sheets write fails / offline** → entry cached locally and retried on
  reconnect; the header shows pending/synced status.
- **Missing keys** → setup wizard + clear, actionable test-button errors.

---

## Project layout

```
api/
  _lib.js            shared request helpers
  vision.js          Claude Vision serverless endpoint
  sheets.js          Google Sheets serverless endpoint
src/
  components/        Header, CameraCapture, ConfirmationPanel, QuantityInput,
                     DuplicateDialog, Dashboard, SettingsModal, SetupWizard,
                     StatusBadge, Toast, Icons
  hooks/             useSettings, useCamera, useInventory
  lib/               api (client), dates, storage
  App.jsx, main.jsx, index.css
```

---

## Optional / future enhancements

Email alerts before expiration, CSV export, barcode scanning, per-entry notes,
bulk import, and quantity decrement when items are consumed.
