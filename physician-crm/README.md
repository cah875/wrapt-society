# Physician Relations — Northwest Specialty Hospital

A single, self-contained HTML file (`index.html`) — no build step, no dependencies, hospital
logo and brand colors embedded. Open it in a browser, or upload it to any static host
(Vercel, Netlify, GitHub Pages, IIS, S3…) and point a domain at it.

## What it tracks

**Physician profile (the "customer")**
1. Contact information (phones, email, fax, NPI)
2. Specialty
3. Practice (name + address)
4. Practice manager / contact
5. Goals & actuals by year — surgeries and ancillary, with % to goal

**Contact management (internal team)**
- Date · 1) Who made the contact (team drop-down) · 2) How (Phone Call / Email / In Person / Text)
- 3) What was communicated + file attachments · 4) The ask · 5) Follow-up date
- Status tracker: 1) Prospect / Referrer → 2) Credentialing Packet Sent → 3) Credentialing Done → 4) On-Boarded,
  with a one-click "Move to next step" button and a dated history

Plus: Home page with "Needs attention" list, follow-up queue (overdue / due this week / just mine),
searchable activity log, spreadsheet (CSV) downloads, full JSON backup/restore, print view per physician.

## Design principles
- Built for people who are not comfortable with computers: large text and buttons, numbered
  questions on the contact form, one obvious green action per screen, plain-English labels,
  confirmation before anything is changed or deleted, no icons without words.
- Professional look that matches northwestspecialtyhospital.com (Open Sans, green / brown / teal, logo).
- Works on desktop, tablet and phone.

## Logins
Defined in the `CONFIG` block at the top of `index.html`. Only SHA-256 hashes of
`username:password` are stored — never the passwords. To change a password: sign in as `admin` →
Settings → *Password hash generator* → paste the hash into `CONFIG.users` → re-upload the file.
The `admin` login can delete physicians, restore backups and erase data; the others cannot.

## Important limitations of this version
- **Data is stored in each person's browser** (localStorage + IndexedDB for attachments). Team members
  do not see each other's entries unless a backup is exported and imported. A shared database is the
  recommended next step so all users see the same records.
- The login screen keeps casual visitors out, but it is client-side only. For real access control, also
  turn on password protection at the host (e.g. Vercel Deployment Protection, Cloudflare Access).
- Do not enter patient information (PHI) — this tool is for physician business-relationship data.
