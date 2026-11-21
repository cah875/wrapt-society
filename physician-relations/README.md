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
  surgeon-level totals only. The weeks and months the file covers replace what is stored for them; everything outside
  that stretch stays, so a monthly export can be added on top of earlier ones. Export whole months, starting the day
  after the stored data ends (the review step points out any gap or partial month).
  Surgeons whose names differ between exports ("DEWING, CHRISTOPHE" in a width-limited export, "DEWING, CHRISTOPHER"
  in another; two spellings that match the same physician record) are folded into one record, on upload and at sign-in.
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

**Reports → Clinic financials** — upload the monthly *NWSH Departmental Operating Statements* workbook (.xlsm) and
DocDock reads every department tab (33001 Internal Medicine through 88100 Inland Shoulder Clinic, imaging included;
hospital departments optional). For each department it keeps visits, gross and net revenue, allowances, every expense
category with its GL lines, EBITDA, fixed and variable cost, break-even volume and staffing hours, by month, with the
budget and the prior year. The overview ranks departments by EBITDA and by how much of break-even volume they reach;
a department page tells the story in a sentence, charts visits against break-even, revenue against expenses, the
expense mix and fixed vs variable cost, shows the statement by month (actual, budget, prior year or variances, with
GL drill-down) and has a what-if panel: change revenue per visit, variable cost per visit, fixed cost or clinic days
and see the break-even volume and gap recalculate. Everyone with a login can open it.

Each department page also has: a **key** defining every term in plain language; **Why the result is what it is**
(the gap to budget or prior year split into visits, revenue per visit and each expense category); **Fixed and variable
cost** worked out both ways, since provider pay is the largest cost in a clinic and behaves differently from supplies
(the finance statement counts physician, NP and PA salaries as variable; "Providers on salary" counts them as fixed,
which is the right view when existing providers have open slots); a **Provider pay planner** (set a base pay, a rate
per work RVU and the encounters a month for physicians, NPs and PAs, or add a provider, and see provider pay, pay per
work RVU, EBITDA and break-even recalculate; nothing is saved); **Visit coding and what it is worth** (office-visit
levels by provider against all NWSH clinics, and what moving visits from one level to another adds in revenue and
takes off break-even, valued at the Medicare fee schedule carried in Meditech); and a **purpose note** anyone can
edit, for departments that run at a loss on purpose.

**Reports → Provider billing** — upload the Meditech *Performing Provider RVU* report (.txt), one month at a time.
The month the report was run for replaces what is stored; charges dated just outside it (stays that cross month end)
are added to their own months without replacing anything. Only totals by performing provider, visit location, month
and CPT/HCPCS code are stored (encounters, units, work RVUs, charges, and payments by provider, since Meditech posts
payments to the account, not to a code); patient names and account numbers never leave the browser. Filter by location, provider and month; see
E/M level mix, wRVU per encounter, collections and every code billed. Each billing view states how much of it was **final coded** (the account's Meditech coding status was Final when
the report was run). Locations are tied to their department tab,
so a department's financial page also shows billing by provider, and a matched physician's page gets a
"Billing & RVUs" card.

The chart area of a clinic page includes a **visit level curve** (the E/M bell curve): the share of office visits
billed at each level, for established and new patients, drawn against all NWSH clinics and against the national
Medicare distribution for the clinic's specialty (CMS, Medicare Part B Physician/Supplier National Data, CY2025,
Evaluation and Management Codes by Specialty; the specialty can be changed on the card and is saved for everyone).
To refresh the national figures when CMS posts a new year, replace the `EM_NATIONAL` constant in index.html.

Charge lines with no performing provider are the hospital's own facility billing (room time, implants, supplies,
recovery, technical fees). Provider billing keeps them out of the provider table and shows them under
**Hospital facility charges**, by attending provider. Each clinic's financial page ends with **What this clinic's
providers bring to the rest of the hospital**, in charges from the RVU reports: imaging they ordered at the hospital
(MRI, CT, ultrasound, mammography), X-rays taken in the clinic (booked to Imaging) and facility charges on their
surgery, procedure and therapy cases, none of which sit on the clinic's own statement. **Clinic to procedure** (Provider billing, third view; also a card on each
clinic page) shows the surgeries, endoscopies, pain procedures and interventional radiology cases a clinic's patients
went on to. The RVU report names no referring provider on a surgery account, so patients are followed instead: the
administrator picks all the monthly RVU report files together under **Trace patients to procedures**, and the browser
links each procedure to clinic services the same patient had with another provider in the 180 days before it (30, 60,
90 or 180 on screen). A visit is a billed service on a clinic visit account; the surgeon's and assistant's own fees
never count, and a same-day line counts only with an office visit code. Only counts and hospital facility charges by
clinic provider, clinic, proceduralist, type, month and time since the visit are stored: no patient names, account
numbers, file names or payments. It shows where patients went next, not who referred them. Each run replaces the
last; **Remove the trace** deletes it. The Clinic financials overview opens with **What stands
out**: the largest losses, the biggest budget misses and their main cause, departments within reach of break-even,
and what closing each clinic's visit-coding gap to the NWSH average would be worth. Months uploaded before this
version need their RVU report uploaded again for facility charges to be tied to an attending.

**Imaging referrals** leave cancelled orders out of every count. Meditech files C-arm time during pain injections
and surgery under Interventional Radiology ("IR Fluoroscopy <1hr / >1hr"); DocDock moves those lines to their own
"Procedure Fluoroscopy" group, switched off unless turned on, so Interventional Radiology shows real IR referrals
(arthrograms, myelograms, lines and ports). Re-upload the imaging export once for this to apply to stored months.

**Searchable pickers** — the surgeon and referring-provider boxes on the reports filter as you type; arrow keys
and Enter pick, the × clears. The surgical volume report can be scoped to a whole specialty ("All Orthopedics")
and broken out by service line (operating rooms, surgery center, pain and procedure rooms, endoscopy,
interventional radiology, Axis). The imaging report can rank providers by one modality.

**Tidy up names** (Settings, administrator) — finds different spellings of the same specialty, city or practice
("Orthopaedics", "orthopedics", "Orthopedic") and merges them. New entries typed on the physician form or
uploaded from a spreadsheet are matched to spellings already on file.

**Sign-out timer** (Settings, administrator) — how long someone can leave the app untouched before being signed
out. Default 4 hours; the value in Settings overrides `idle_minutes` in config.php.

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
