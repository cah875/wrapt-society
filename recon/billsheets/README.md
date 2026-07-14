# Billsheet scans (local only — do NOT commit)

Drop the source billsheet photo for a case here, named after the case file
(without `.json`). The preview dashboard (`recon/build/preview.mjs`) auto-detects
these and renders a **"View billsheet"** link on the matching case card.

Expected filenames (any of `.jpg`, `.jpeg`, `.png`):

| Case file                    | Image to save here            |
|------------------------------|-------------------------------|
| `recon/cases/gregg-rhip.json`  | `gregg-rhip.jpg`   (Gregg, Vernon L) |
| `recon/cases/griese-lhip.json` | `griese-lhip.jpg`  (Griese, Leslie R) |

## Why these are gitignored

These scans carry PHI in the clear — patient name, MRN, and date of birth on the
patient sticker. Everything in this folder except this README is ignored by git
(`.gitignore`) so the images stay on your machine and never reach GitHub or a
deployed Vercel build. If you ever want a billsheet visible on a shared/hosted
dashboard, redact the patient sticker first and commit the redacted copy
deliberately.
