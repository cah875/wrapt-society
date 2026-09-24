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

  'users' => [
    ['username' => 'admin',   'name' => 'Administrator',    'role' => 'admin', 'team' => false,
     'hash' => '$2y$12$jk8/CpasRbpUxf4aC8DhyOKHAfk.On36oES/UbyeXnHQVu/AHH0Gu'],
    ['username' => 'josh',    'name' => 'Josh Tolman',      'role' => 'user',
     'hash' => '$2y$12$94YgAU.MwlYVBstJyPlXlePF7RPVjPz6zKvkfstv7xLqKHNs//WAW'],
    ['username' => 'heather', 'name' => 'Heather Claussen', 'role' => 'user',
     'hash' => '$2y$12$i2sxXFwWiXLZExF4bGNgBOilJOhDXjv08RRYvNMqLDMFsk41lVNAq'],
    ['username' => 'angela',  'name' => 'Angela Meadows',   'role' => 'user',
     'hash' => '$2y$12$YpDDyIUMA7c7htLfd3m6xu4qG6MhGNtPZO6K3dFpzFcSVsdp9/H4O'],
  ],
];
