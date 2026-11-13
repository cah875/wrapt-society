# Physician Relations — Northwest Specialty Hospital

Physician CRM + referral / order tracking, built to be dropped into a web folder as-is.

```
physician-relations/
  index.html    the whole app (logo and brand embedded)
  api.php       the server side — talks to the database
  config.php    logins (edit this one)
  .htaccess     keeps the database private
  .user.ini     raises the hosting's upload limit so attachments up to 15 MB work
  lib/          pdf.js (Mozilla, Apache 2.0) — reads Meditech worklist PDFs in the browser
                xlsx.full.min.js (SheetJS, Apache 2.0) — reads PowerBI .xlsx exports for the scorecard
  imports/      scorecard data files to upload through the app (not for the web folder)
  data/         created automatically on first use: the SQLite database + attachments
```

## Putting it on docdockcrm.com
The domain needs ordinary PHP web hosting (GoDaddy Web Hosting / cPanel, or any Linux host). It cannot run on
"static" or "website builder" hosting, because api.php has to write the database file.
1. In the hosting control panel, point docdockcrm.com at a folder (GoDaddy: *Domains → Add domain* and note the
   document root, usually `public_html/docdockcrm.com`).
2. Upload the **contents** of this folder into that document root, so `index.html` and `api.php` sit directly
   inside it. Nothing to install, no build step.
3. Turn on the free SSL certificate for the domain (GoDaddy: *Security → SSL/TLS*). The .htaccess file redirects
   every visit to https:// automatically.
4. Open https://docdockcrm.com. The first visit creates `data/physician-relations.sqlite`. If you see
   "data folder is not writable", give the `data` folder write permission in the file manager (755 or 775).
5. Sign in. Everyone now shares one database and sees the same records, on any device.

**Preview on your own computer:** double-click `index.html`. It runs in *preview mode* (yellow banner) and
keeps records in that browser only — handy for training. If you have PHP installed, run
`php -S localhost:8080` inside the folder and open http://localhost:8080 to preview the real shared mode.

## What it does
**Physicians** — contact info, specialty, practice, practice manager, yearly goals vs. actuals (surgeries and
ancillary), status tracker (Prospect / Referrer → Packet Sent → Credentialing Done → On-Boarded).

**Contact log** — every call, email, visit or text: who, how, what was said, attachments, the ask, and a
follow-up date. Follow-ups roll into a queue (overdue / due this week / just mine).

**Referrals & Orders** — follow a patient hand-off step by step so nobody is lost:
- A referral is a chain of steps, e.g. *Urgent Care → Dr. Glassman* (spine consult), then
  *Dr. Glassman → Imaging – CT* (CT lumbar), then *Dr. Glassman → Physical Therapy*.
- Each step has four checkpoints with dates: **Sent → Scheduled → Seen / done → Results back**. The days
  between checkpoints are shown on each step.
- A referral is flagged **At risk** when nothing has moved for N days (Settings, default 14) or an appointment
  date passes without being marked as seen. At-risk referrals appear on the Home page and as a red count on
  the Referrals tab.
- "Patient didn't follow through" records a drop-out with a reason; "Close — care complete" ends a journey.
- Reports: in progress / at risk / completed / dropped out, average days until seen and until results, and a
  by-destination table (who receives referrals and how fast they move). Spreadsheet download of every step.
- Each physician's page shows the referrals they sent or received.
- **Import from Meditech**: in Meditech Expanse open ARM Tracking → the *Referrals - All* worklist, print it to
  PDF, then on the Referrals page click *Import from Meditech* and pick the PDF. New referrals are added, ones
  already tracked get their Meditech status updated, nothing entered by hand is overwritten. Patients are
  stored by MRN and initials only; names and birth dates in the PDF are dropped on the spot. The same button
  also accepts a `.json` worklist file prepared outside the app. Do not upload worklist files to the web
  folder — they go through the browser only.

**Reports → Surgical volume** — procedure cases and gross charges by surgeon, by week and by month, for every year loaded.
Pick a surgeon (or all surgeons), switch between case volume and gross charges, smooth the weekly line with a
4-week average, and turn room types on and off (OR 1–10, Surgery Center 11–12, MPR, Endo / Axis / IR). The
summary compares the latest year with the same weeks of earlier years; the table shows every month, quarter,
same-weeks total and full year. Each matched physician's page gets a "Surgical volume & charges" card.
- **Upload surgeon scorecard** (administrator, on the Scorecard page or in Settings) reads the PowerBI case
  export (.xlsx or .csv) or a scorecard data file (.json) in the browser, shows what will change, and saves
  surgeon-level totals only. The years in the file replace what is stored for those years; other years stay.
- **Download data file** writes the stored totals back out as a .json that can be uploaded again or kept as a
  backup. The starting file is in `imports/`.

**Reports → Imaging referrals** — who orders imaging at NWSH facilities (hospital, Axis, Breast Imaging Center, urgent
cares), by month, modality and facility, with a resulted and cancelled count. Pick a referring provider or see
everyone, choose a period, and turn modalities and facilities on and off. Matched physicians get an "Imaging
referrals to NWSH" card on their page, and the physicians list can sort by imaging exams ordered.
- **Upload imaging referrals** (administrator, on the Imaging referrals page or in Settings) reads the Meditech
  imaging export (.txt or .csv with SITE NAME, CATEGORY, SVC DATE, STATUS, REFERRING columns) in the browser.
  Patient columns are dropped on the spot; only counts by provider, month, modality and facility are stored.
  The months in the file replace what is stored for those months; other months stay.
- **Download data file** writes the stored counts as a .json that can be uploaded again.

## Logins
Edit `config.php`. Passwords are stored as bcrypt hashes, never in plain text. To change one: sign in as
`admin` → Settings → Password hash generator → paste the hash into `config.php`. The `admin` login is the
only one that can delete records, restore a backup or erase everything.

## Patient information — please read
Referral tracking involves patient data, which makes this a HIPAA matter:
- The app asks for **MRN and initials only** and tells users not to enter names or dates of birth. Keep it that way.
- Use HTTPS (the site already has it), keep the folder behind the built-in login, and do not put it on hosting
  that your compliance officer has not approved for PHI. Shared web hosting often does not come with a
  Business Associate Agreement — check before going live with real patient identifiers.
- Export a backup regularly (Settings) and store it somewhere secure.
