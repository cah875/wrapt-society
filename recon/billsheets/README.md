# Billsheet scans (local only — do NOT commit)

Each case can declare its source billsheet photo via a `"billsheet"` field in
its case JSON (e.g. `recon/cases/gregg-rhip.json` → `"billsheet": "gregg-rhip.jpg"`).
The dashboard (`recon/build/preview.mjs`) renders a **"View source billsheet"**
link on that case card, pointing to the filename **in the same folder as
`preview.html`** (i.e. `recon/`).

So to make the links work: put the photos next to `recon/preview.html`:

| Case                           | Save the photo as (in `recon/`) |
|--------------------------------|---------------------------------|
| Gregg, Vernon L                | `gregg-rhip.jpg`                |
| Griese, Leslie R               | `griese-lhip.jpg`              |

Open `recon/preview.html` in a browser and the links will open the images.

If instead you drop the images into *this* `recon/billsheets/` folder, running
`node recon/build/preview.mjs` will also emit a **`recon/preview.local.html`**
with each scan embedded inline — one self-contained file that prints straight
to PDF.

## Why these are gitignored

These scans carry PHI in the clear — patient name, MRN, and date of birth on the
patient sticker. All `*.jpg/*.jpeg/*.png` under `recon/`, everything in this
folder except this README, and `preview.local.html` are ignored by git so the
images stay on your machine and never reach GitHub or a deployed Vercel build.
If you ever want a billsheet on a shared/hosted dashboard, redact the patient
sticker first and commit the redacted copy deliberately.
