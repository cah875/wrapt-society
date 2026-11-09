# Scorecard data files

Files here are uploaded through the app (Scorecard → **Upload surgeon scorecard**, administrator only).
They are not part of the web folder — do not copy this folder to the server.

- `surgeon-volumes-2024-2026.json` — procedure cases and gross charges by surgeon, by week and by month,
  for 2024, 2025 and 2026 through Sep 28, 2026. 2024–2025 come from the final-billed PowerBI snapshot used
  for the 2024–25 OR dashboard; 2026 comes from the 2026 dashboard build. Surgeon-level totals only.

The same upload button also accepts the PowerBI case export (.xlsx or .csv) with the columns
Physician Name, Admit Date (or Discharge Date), Operating Room, Operating Minutes, Charge Amt and
Account Number. Rows without room time are ignored; the years in the file replace what is stored for
those years and other years are kept. The **Download data file** button writes a file in this same format.
