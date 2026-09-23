# Physician Relations CRM

A single, self-contained HTML file (`index.html`) — no build step, no dependencies.
Open it in a browser, or upload it to any static host (Vercel, Netlify, GitHub Pages, IIS, S3…).

## What it tracks

**Physician profile (the customer)**
1. Contact info (phones, email, fax, NPI)
2. Specialty
3. Practice (name + address)
4. Practice manager / contact
5. Goals / actuals by year — surgeries and ancillary, with % to goal

**Contact management (internal team)**
- Date · 1) Who contacted (team drop-down) · 2) How (Email / Phone Call / In Person / Text)
- 3) What was communicated + file attachments · 4) Ask · 5) Follow-up date
- Status tracker: a) Prospect / Referrer → b) Credentialing Packet Sent → c) Credentialing Done → d) On-Boarded (with dated history)

Plus: dashboard, follow-up queue (overdue / due this week / by owner), searchable contact log, CSV exports, full JSON backup/restore.

## Logins
Four users are defined in the `CONFIG` block at the top of `index.html`. Only SHA-256 hashes of
`username:password` are stored. To change a password: Settings → *Password hash generator* →
paste the hash into `CONFIG.users` → re-upload the file.

## Important limitations of this version
- **Data is stored in each person's browser** (localStorage + IndexedDB for attachments). Team members
  do not see each other's entries unless a backup is exported and imported. A shared database is the
  recommended next step.
- The login screen keeps casual visitors out, but it is client-side only. For real access control, also
  turn on password protection at the host (e.g. Vercel Deployment Protection, Cloudflare Access).
- Do not enter patient information (PHI) — this tool is for physician business-relationship data.
