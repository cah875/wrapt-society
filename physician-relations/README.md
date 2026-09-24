# Physician Relations — Northwest Specialty Hospital

Physician CRM + referral / order tracking, built to be dropped into a web folder as-is.

```
physician-relations/
  index.html    the whole app (logo and brand embedded)
  api.php       the server side — talks to the database
  config.php    logins (edit this one)
  .htaccess     keeps the database private
  data/         created automatically on first use: the SQLite database + attachments
```

## Putting it on the website
1. Upload the whole `physician-relations` folder into the site's web root (on GoDaddy / cPanel that is
   `public_html`). Nothing to install, no build step — the host just needs PHP, which it already has.
2. Open `https://your-domain.com/physician-relations/`. The first visit creates `data/physician-relations.sqlite`.
   If you see "data folder is not writable", give the `data` folder write permission in the file manager.
3. Sign in. Everyone now shares one database and sees the same records, on any device.

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
