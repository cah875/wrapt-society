# Hospital Implant Expiration Tracker

A fast, foolproof web app for materials technicians at a hospital loading dock.
A tech photographs implant/biologic packaging, **Claude Vision** reads the
product name, expiration date, and lot number, and the entry — with a quantity —
is saved to a **local Excel file** that syncs to the rest of the organization via
**OneDrive / SharePoint**.

> Built to be operated with gloved hands on a laptop or tablet: large buttons,
> high contrast, no fiddly inputs, and ~10–15 seconds per batch.

---

## Features

- 🏷️ **Barcode / UDI scanning** — a USB 2D scanner (or manual entry) reads the
  GS1 UDI barcode and decodes **GTIN, expiration, and lot** in one scan. No API
  cost. Product names come from the **FDA GUDID** database plus a
  learn-as-you-go cache, so Vision is rarely needed.
- ↕️ **Receive & Use modes** — *Receive* adds stock; *Use* removes one unit per
  scan (scan the implant log stickers at the Revenue Cycle handoff, or scan items
  off the cart). Decrement is free and needs no photo.
- 📷 **Webcam capture (fallback)** — large green *CAPTURE PHOTO* button, live
  preview, retake/confirm, and multi-camera selection — for items whose barcode
  is damaged or missing.
- 🤖 **Claude Vision extraction** — returns `{ product, expiration_date, lot_number }`
  plus a confidence level and a blurry-photo flag. All fields are editable.
- 🔢 **Gloved-hand quantity input** — big +/- steppers, batch presets, and a
  configurable unit type (each/box/case/set/vial).
- 🔁 **Duplicate detection** — same product + lot + expiration prompts you to
  *add more units* instead of creating a duplicate row.
- 📊 **Excel logging** — writes directly to a `.xlsx` with columns `Timestamp,
  Product, Expiration, Lot, Quantity, Unit, Days Until Expiration, Status,
  Location`. The Status column is color-coded (GREEN > 60d, YELLOW 30–60d,
  RED < 30d / expired). Duplicate items update their existing row so counts stay
  accurate.
- 🧭 **Dashboard** — total units, expiring-soon summary, recent items,
  search/filter, and group-by-expiration.
- 🛟 **Never loses data** — every entry is cached in `localStorage`; if a write
  to the Excel file fails (file busy, permission lapsed), the entry is queued and
  retried.
- ⚙️ **Setup wizard + Settings** — connect/create the Excel file, Claude key with
  a **Test** button, alert threshold, unit types, camera, dark mode, high
  contrast, and font scaling.

---

## Barcode / UDI workflow

Medical implant packages carry a **UDI** (Unique Device Identifier) in a GS1
barcode (GS1-128 or GS1 DataMatrix). One scan yields:

| GS1 AI | Field |
| --- | --- |
| `(01)` | GTIN (identifies the product) |
| `(17)` | Expiration date (`YYMMDD`; day `00` = end of month) |
| `(10)` | Lot / batch |
| `(21)` | Serial (when present) |

- **Receiving:** in *Receive* mode, scanning a package pre-fills the confirm
  screen with GTIN/expiration/lot; the tech sets the quantity and logs it. The
  product **name** is resolved from the GTIN via the FDA GUDID API
  (`/api/gudid`) and cached locally, so repeat items are instant and free.
- **Using:** in *Use* mode, scanning a used implant's sticker removes one unit
  from the matching in-stock row (matched by GTIN + lot + expiration). This is
  designed to ride on the existing "sticker → implant log → Revenue Cycle"
  handoff so OR staff aren't burdened, but it also works for scanning items off
  the cart.

**Hardware:** a **2D USB barcode scanner** (keyboard-wedge) is recommended —
many implant UDIs are 2D DataMatrix. For the most reliable parsing of
variable-length fields, configure the scanner to transmit the **GS1 / FNC1
group separator**. The webcam path remains available as a fallback, and any code
can be typed/pasted manually.

The Excel file gains a **GTIN** column (added automatically; existing files are
migrated on the next write).

## How data is stored (and why there's no cloud database)

The inventory **Excel file lives on the technician's laptop**, inside a folder
that OneDrive keeps synced with SharePoint:

```
OneDrive - YourHospital\Materials\implant-expiration-log.xlsx
```

The app writes to that file **in the browser** using the
[File System Access API](https://developer.mozilla.org/docs/Web/API/File_System_API).
OneDrive then syncs it up so anyone with access to the SharePoint folder can open
and view it — no Azure app registration, no Google account, no server database.

**Requirements / constraints**

- **Browser:** Microsoft **Edge** or Google **Chrome** (the File System Access
  API is not available in Firefox or Safari).
- **One writer:** designed for a single logging laptop. Others *view* the file on
  SharePoint. If two machines wrote to the same synced file simultaneously,
  OneDrive would create conflict copies.
- The app remembers the chosen file across sessions; after a full browser/OS
  restart it may ask the tech to re-grant permission once (a single click via the
  header's *Reconnect* badge or Settings).

---

## Architecture

```
React (Vite) frontend
  ├─ Camera + barcode + UI + dashboard .. all in the browser
  ├─ Excel read/write (ExcelJS) ......... local .xlsx via File System Access API
  ├─ /api/vision (Vercel function) ...... Claude Vision (Anthropic)
  └─ /api/gudid  (Vercel function) ...... GTIN → name via FDA GUDID (free)
```

- **Frontend:** React 18 + Vite + Tailwind CSS, `axios` for HTTP.
- **One serverless function** (`api/vision.js`) keeps the Anthropic API key off
  the client and avoids browser CORS limits. Inventory persistence is fully
  client-side.
- **ExcelJS** is lazy-loaded on the first file operation to keep the initial
  bundle small.

The Claude key can come from a **server environment variable** (recommended) or
from the in-app Settings page (stored only in the browser).

---

## Quick start (local)

```bash
npm install

# Run the Vite dev server + the /api/vision function together:
npx vercel dev          # serves the app and /api on one origin (recommended)

# — or — frontend only (then point the Vite proxy at your API host):
npm run dev
```

Open the app in **Edge or Chrome**, then complete the in-app setup wizard.

---

## Configuration

The only secret is the Claude Vision key. Copy `.env.example` to `.env` (for
`vercel dev`) or set it as a **Vercel Environment Variable** in production:

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claude Vision API key ([console](https://console.anthropic.com/settings/keys)). |
| `CLAUDE_VISION_MODEL` | *(optional)* override the vision model. |

### Connecting the Excel file (one time, on the logging laptop)

1. Open the deployed app in **Edge** (or Chrome).
2. **Settings → Excel File → Create new file…** (or *Choose existing file…*).
3. Save it inside your OneDrive-synced SharePoint folder, e.g.
   `OneDrive - YourHospital\Materials\implant-expiration-log.xlsx`.
4. Grant the permission prompt. Done — every logged item now appends to that
   file and OneDrive shares it with your team.

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, **Import** the repo (framework auto-detected as Vite).
3. Add `ANTHROPIC_API_KEY` (and optionally `CLAUDE_VISION_MODEL`).
4. Deploy. `vercel.json` maps `/api/*` to the serverless function and serves the
   SPA for all other routes. (HTTPS — required for camera access — is automatic.)

---

## Error handling & edge cases

- **Vision fails / unreadable** → automatic fallback to a manual-entry form.
- **Blurry photo** → flagged with a warning banner; verify or retake.
- **Unparseable date** → inline error; the field stays editable and many formats
  (MM/DD/YYYY, M/D/YY, `AUG 2026`, `08/2026`, ISO) are normalized.
- **Quantity > 100** → requires an explicit confirmation checkbox.
- **Excel write fails / permission lapsed** → entry cached locally and retried;
  the header shows a *not saved* / *Reconnect* badge.
- **Unsupported browser** → clear prompt to switch to Edge/Chrome.

---

## Project layout

```
api/
  _lib.js            shared request helpers
  vision.js          Claude Vision serverless endpoint
  gudid.js           FDA GUDID GTIN → name lookup
src/
  components/        Header, CameraCapture, ConfirmationPanel, QuantityInput,
                     DuplicateDialog, SaveErrorDialog, ScanPanel, Dashboard,
                     SettingsModal, SetupWizard, StatusBadge, Toast, Icons
  hooks/             useSettings, useCamera, useInventory, useScanner
  lib/               api (client), dates, storage, excel, gs1 (UDI parser)
  App.jsx, main.jsx, index.css
```

---

## Optional / future enhancements

Email alerts before expiration, CSV export, barcode scanning, per-entry notes,
bulk import, and quantity decrement when items are consumed.
