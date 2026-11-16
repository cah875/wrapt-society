# Scorecard data files

Files here are uploaded through the app (Scorecard → **Upload surgeon scorecard**, administrator only).
They are not part of the web folder — do not copy this folder to the server.

- `surgeon-volumes-2024-2026.json` — procedure cases and gross charges by surgeon, by week, month and
  service line, for 2024, 2025 and 2026 through Nov 12, 2026. 2024 comes from the final-billed PowerBI snapshot
  used for the 2024–25 OR dashboard (that snapshot carried no room names, so 2024 sits under "Other rooms &
  older uploads"); 2025 comes from the POWERBI 24-25.xlsx export with room names; 2026 comes from the Nov 16,
  2026 build of the 2026 dashboard. Surgeon-level totals only. Spellings of one surgeon that differ between
  exports ("DEWING, CHRISTOPHE" / "DEWING, CHRISTOPHER") are folded into one record.

The same upload button also accepts the PowerBI case export (.xlsx or .csv) with the columns
Physician Name, Admit Date (or Discharge Date), Operating Room, Operating Minutes, Charge Amt and
Account Number. Rows without room time are ignored. The weeks and months the file covers replace what is stored for them and
everything outside that stretch is kept, so a monthly export adds to earlier uploads. The **Download data file** button writes a file in this same format.
