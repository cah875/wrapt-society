<?php
/*
  Northwest Specialty Hospital — Physician Relations
  ---------------------------------------------------
  This is the only file you normally need to edit on the web server.

  LOGINS
  Passwords are never stored here — only a bcrypt hash of each one.
  To set a new password: sign in as admin → Settings → "Password hash generator",
  then paste the hash into that user's 'hash' line below and re-upload this file.

  role  'admin' can delete physicians, restore backups and erase data.
  team  false keeps a login out of the "Who made the contact?" list.
*/
return [
  'app_name'     => 'Physician Relations',
  'idle_minutes' => 30,   // sign out after this many idle minutes
  'max_file_mb'  => 15,   // largest attachment allowed
  'app_url'      => 'https://docdockcrm.com',       // used in emails
  'mail_from'    => 'noreply@docdockcrm.com',       // sender address for emails
  'timezone'     => 'America/Los_Angeles',          // for the morning email and dates in it
  'digest_key'   => 'change-this-to-a-long-random-phrase',   // lets digest.php be run from a URL (see README)

  // Logins are seeded from here on first use, then managed in Settings.
  // An email listed here is copied to a login that has none yet.
  'users' => [
    ['username' => 'admin',   'name' => 'Christopher Hill', 'role' => 'admin', 'team' => false, 'email' => 'christopher.hill@nwsh.com',
     'hash' => '$2y$12$jk8/CpasRbpUxf4aC8DhyOKHAfk.On36oES/UbyeXnHQVu/AHH0Gu'],
    ['username' => 'josh',    'name' => 'Josh Tolman',      'role' => 'user', 'email' => 'josh.tolman@nwsh.com',
     'hash' => '$2y$12$94YgAU.MwlYVBstJyPlXlePF7RPVjPz6zKvkfstv7xLqKHNs//WAW'],
    ['username' => 'heather', 'name' => 'Heather Claussen', 'role' => 'user', 'email' => 'heather.claussen@nwsh.com',
     'hash' => '$2y$12$i2sxXFwWiXLZExF4bGNgBOilJOhDXjv08RRYvNMqLDMFsk41lVNAq'],
    ['username' => 'angela',  'name' => 'Angela Meadows',   'role' => 'user', 'email' => 'angela.meadows@nwsh.com',
     'hash' => '$2y$12$YpDDyIUMA7c7htLfd3m6xu4qG6MhGNtPZO6K3dFpzFcSVsdp9/H4O'],
  ],
];
