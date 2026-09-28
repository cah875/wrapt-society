<?php
/*
  Northwest Specialty Hospital — Physician Relations
  Server API. index.html talks to this file; you should not need to edit it.

  Everything is stored in the "data" folder next to this file:
    data/physician-relations.sqlite   the shared database (created automatically)
    data/files/                       attachments
  The data folder is blocked from the web by the .htaccess files written here.
*/
declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(E_ALL);
set_error_handler(function ($no, $str, $file, $line) { throw new ErrorException($str, 0, $no, $file, $line); });

function out(array $data, int $code = 200): never {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}
function fail(string $msg, int $code = 400): never { out(['ok' => false, 'error' => $msg], $code); }

try {
  $CFG = require __DIR__ . '/config.php';
} catch (Throwable $e) { fail('config.php could not be read.', 500); }

$DATA = __DIR__ . '/data';
if (!is_dir($DATA)) { @mkdir($DATA, 0750, true); }
if (!is_dir($DATA) || !is_writable($DATA)) fail('The "data" folder next to api.php does not exist or is not writable. Create it and give the web server write permission.', 500);
if (!file_exists("$DATA/.htaccess")) @file_put_contents("$DATA/.htaccess", "Require all denied\n");
if (!file_exists("$DATA/index.html")) @file_put_contents("$DATA/index.html", '');
if (!is_dir("$DATA/files")) @mkdir("$DATA/files", 0750, true);

require __DIR__ . '/lib.php';

/* ---------- session / auth ---------- */
$secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
session_name('nwshpr');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $secure, 'httponly' => true, 'samesite' => 'Lax']);
ini_set('session.gc_maxlifetime', (string)($CFG['idle_minutes'] * 60 * 2));
session_start();

/* Logins live in the database (collection "users") so the admin can manage them from
   Settings. config.php only seeds the very first set; after that it is a fallback. */
function dbUsers(): array {
  static $cache = null;
  if ($cache === null) { $cache = store()->all()['users'] ?? []; usort($cache, fn($a, $b) => strcasecmp($a['username'], $b['username'])); }
  return $cache;
}
function allUsers(): array { global $CFG; $d = dbUsers(); return $d ?: $CFG['users']; }
function userRecord(array $u): array {
  return ['id' => strtolower($u['username']), 'username' => strtolower($u['username']), 'name' => $u['name'], 'role' => ($u['role'] ?? 'user') === 'admin' ? 'admin' : 'user', 'team' => ($u['team'] ?? true) !== false, 'email' => strtolower(trim((string)($u['email'] ?? ''))), 'digest' => ($u['digest'] ?? true) !== false, 'hash' => $u['hash'],
    'resetHash' => $u['resetHash'] ?? '', 'resetExpires' => (int)($u['resetExpires'] ?? 0)];
}
// Copies an email (and a real name in place of "Administrator") from config.php to logins that have none yet.
function syncUsersFromConfig(): void {
  global $CFG;
  foreach (dbUsers() as $u) {
    $c = null; foreach ($CFG['users'] as $x) if (strcasecmp($x['username'], $u['username']) === 0) $c = $x;
    if (!$c) continue;
    $rec = userRecord($u); $changed = false;
    if ($rec['email'] === '' && !empty($c['email'])) { $rec['email'] = strtolower($c['email']); $changed = true; }
    if ($rec['name'] === 'Administrator' && !empty($c['name']) && $c['name'] !== 'Administrator') { $rec['name'] = $c['name']; $changed = true; }
    if ($changed) saveUser($rec, 'system');
  }
}
function saveUser(array $rec, string $by): void { store()->apply([['op' => 'put', 'collection' => 'users', 'id' => $rec['id'], 'record' => $rec]], $by); }
function seedUsersIfEmpty(): void {
  global $CFG;
  if (dbUsers()) { syncUsersFromConfig(); return; }
  $ops = array_map(fn($u) => ['op' => 'put', 'collection' => 'users', 'id' => strtolower($u['username']), 'record' => userRecord($u)], $CFG['users']);
  store()->apply($ops, 'system');
}
function findUser(string $username): ?array {
  foreach (allUsers() as $u) if (strcasecmp($u['username'], $username) === 0) return $u;
  return null;
}
function currentUser(): ?array {
  global $CFG;
  if (empty($_SESSION['u'])) return null;
  if (time() - ($_SESSION['t'] ?? 0) > $CFG['idle_minutes'] * 60) { $_SESSION = []; return null; }
  $_SESSION['t'] = time();
  return findUser($_SESSION['u']);
}
function requireUser(): array { $u = currentUser(); if (!$u) fail('Please sign in.', 401); return $u; }
function requireAdmin(): array { $u = requireUser(); if (($u['role'] ?? '') !== 'admin') fail('Only the administrator can do that.', 403); return $u; }
function pub(array $u): array { return ['username' => strtolower($u['username']), 'name' => $u['name'], 'role' => $u['role'] ?? 'user', 'team' => ($u['team'] ?? true) !== false, 'email' => (string)($u['email'] ?? ''), 'digest' => ($u['digest'] ?? true) !== false]; }
function validEmail($v): bool { return $v === '' || filter_var($v, FILTER_VALIDATE_EMAIL) !== false; }
function pubUsers(): array { return array_values(array_map('pub', allUsers())); }
function teamDefault(): array { return array_values(array_map(fn($u) => $u['name'], array_filter(allUsers(), fn($u) => ($u['team'] ?? true) !== false))); }
function validUsername($v): bool { return is_string($v) && preg_match('/^[a-z0-9._-]{2,32}$/i', $v) === 1; }

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = (string)($_GET['action'] ?? '');
$body = [];
if ($method === 'POST') {
  // Simple cross-site request protection: browsers do not add this header to plain form posts.
  if (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') !== 'fetch') fail('Bad request.', 400);
  if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) $body = json_decode((string)file_get_contents('php://input'), true) ?: [];
  else $body = $_POST;
}
$validId = fn($id) => is_string($id) && preg_match('/^[A-Za-z0-9_-]{1,64}$/', $id) === 1;

try {
  switch ($action) {

    case 'ping':
      out(['ok' => true, 'app' => APP_ID, 'mode' => 'server', 'loggedIn' => currentUser() !== null, 'appName' => $CFG['app_name'], 'idleMinutes' => $CFG['idle_minutes'], 'maxFileMB' => $CFG['max_file_mb']]);

    case 'login':
      if ($method !== 'POST') fail('Bad request.');
      $lockUntil = (int)($_SESSION['lock'] ?? 0);
      if (time() < $lockUntil) fail('Too many attempts. Please wait ' . ($lockUntil - time()) . ' seconds and try again.', 429);
      seedUsersIfEmpty();
      $u = findUser(trim((string)($body['username'] ?? '')));
      if ($u && password_verify((string)($body['password'] ?? ''), $u['hash'])) {
        session_regenerate_id(true);
        $_SESSION = ['u' => $u['username'], 't' => time()];
        out(['ok' => true, 'user' => pub($u)]);
      }
      $fails = (int)($_SESSION['fails'] ?? 0) + 1;
      $_SESSION['fails'] = $fails;
      if ($fails >= 5) { $_SESSION['lock'] = time() + 60; $_SESSION['fails'] = 0; }
      usleep(400000);
      fail('That username or password is not correct. Please try again.', 401);

    case 'logout':
      $_SESSION = [];
      if (ini_get('session.use_cookies')) { $p = session_get_cookie_params(); setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']); }
      session_destroy();
      out(['ok' => true]);

    case 'me': {
      $u = requireUser();
      $r = ['ok' => true, 'user' => pub($u)];
      if (($u['role'] ?? '') === 'admin') $r['users'] = pubUsers();
      out($r);
    }

    case 'users':
      requireAdmin();
      out(['ok' => true, 'users' => pubUsers()]);

    case 'user_save': {
      $me = requireAdmin();
      if ($method !== 'POST') fail('Bad request.');
      seedUsersIfEmpty();
      $username = strtolower(trim((string)($body['username'] ?? '')));
      if (!validUsername($username)) fail('Usernames can only contain letters, numbers, dots, dashes or underscores (2–32 characters).');
      $name = trim((string)($body['name'] ?? ''));
      if ($name === '') fail('Please enter the person\'s name.');
      $role = ($body['role'] ?? 'user') === 'admin' ? 'admin' : 'user';
      $team = !empty($body['team']);
      $email = strtolower(trim((string)($body['email'] ?? '')));
      if (!validEmail($email)) fail('That email address does not look right.');
      $existing = findUser($username);
      $pw = (string)($body['password'] ?? '');
      if (!$existing && strlen($pw) < 8) fail('Please choose a password of at least 8 characters.');
      if ($pw !== '' && strlen($pw) < 8) fail('Passwords must be at least 8 characters.');
      if ($existing && strtolower($existing['username']) === strtolower($me['username']) && $role !== 'admin') fail('You cannot remove your own administrator access.');
      if ($existing && ($existing['role'] ?? '') === 'admin' && $role !== 'admin') {
        $admins = array_filter(allUsers(), fn($u) => ($u['role'] ?? '') === 'admin' && strtolower($u['username']) !== $username);
        if (!$admins) fail('There must be at least one administrator.');
      }
      $rec = userRecord(['username' => $username, 'name' => $name, 'role' => $role, 'team' => $team, 'email' => $email, 'digest' => array_key_exists('digest', $body) ? !empty($body['digest']) : (($existing['digest'] ?? true) !== false), 'hash' => $pw !== '' ? password_hash($pw, PASSWORD_BCRYPT) : ($existing['hash'] ?? '')]);
      saveUser($rec, $me['name']);
      out(['ok' => true, 'user' => pub($rec), 'created' => !$existing]);
    }

    case 'profile': {   // a user updates their own email address / morning email choice
      $me = requireUser();
      if ($method !== 'POST') fail('Bad request.');
      seedUsersIfEmpty();
      $email = strtolower(trim((string)($body['email'] ?? '')));
      if (!validEmail($email)) fail('That email address does not look right.');
      $rec = userRecord(findUser($me['username'])); $rec['email'] = $email;
      if (array_key_exists('digest', $body)) $rec['digest'] = !empty($body['digest']);
      saveUser($rec, $me['name']);
      out(['ok' => true, 'user' => pub($rec)]);
    }

    case 'digest_status': {
      requireAdmin();
      $row = null; foreach (store()->all()['settings'] as $s) if (($s['id'] ?? '') === 'digest') $row = $s;
      out(['ok' => true, 'status' => $row ?: ['lastRun' => '', 'sent' => []]]);
    }

    case 'digest_test': {   // sends the signed-in user their own digest right now, and returns the text
      $me = requireUser();
      if ($method !== 'POST') fail('Bad request.');
      seedUsersIfEmpty();
      $u = findUser($me['username']);
      if (empty($u['email'])) fail('Add an email address to your login first (Settings → My login).');
      define('DIGEST_LIB_ONLY', true);
      require_once __DIR__ . '/digest.php';
      $d = buildDigestFor($u, true);
      $text = $d ? $d['body'] : "Nothing is overdue, due this week, or at risk for you right now — on a real morning you would get no email.";
      $subject = $d ? $d['subject'] : '[Test] Physician Relations morning email — nothing to report';
      $sent = sendMail($u['email'], $subject, $text . "\n\n(This was a test send requested from Settings.)");
      if (!$sent) fail('The server could not send the email. Check the mail settings with the host.');
      out(['ok' => true, 'to' => $u['email'], 'text' => $text]);
    }

    case 'forgot': {   // "Forgot your password?" — emails a one-time reset link
      if ($method !== 'POST') fail('Bad request.');
      $last = (int)($_SESSION['forgot_t'] ?? 0);
      if (time() - $last < 30) fail('Please wait a moment before trying again.', 429);
      $_SESSION['forgot_t'] = time();
      seedUsersIfEmpty();
      $u = findUser(trim((string)($body['username'] ?? '')));
      $generic = ['ok' => true, 'message' => 'If that username has an email address on file, a reset link is on its way. Check your spam folder if it does not arrive within a few minutes.'];
      if (!$u || empty($u['email'])) out($generic);
      $token = bin2hex(random_bytes(20));
      $rec = userRecord($u); $rec['resetHash'] = hash('sha256', $token); $rec['resetExpires'] = time() + 30 * 60;
      saveUser($rec, 'system');
      $link = appUrl() . '/#/reset/' . $token;
      $body = "Hello {$u['name']},\n\nSomeone asked to reset the password for the Physician Relations login \"{$u['username']}\".\n\nOpen this link within 30 minutes to choose a new password:\n$link\n\nIf you did not ask for this, you can ignore this email — your password has not changed.\n\nNorthwest Specialty Hospital — Physician Relations";
      if (!sendMail($u['email'], 'Reset your Physician Relations password', $body)) error_log("physician-relations: email could not be sent; reset link for {$u['username']}: $link");
      out($generic);
    }

    case 'reset': {
      if ($method !== 'POST') fail('Bad request.');
      $token = (string)($body['token'] ?? '');
      $pw = (string)($body['password'] ?? '');
      if (strlen($pw) < 8) fail('Please choose a password of at least 8 characters.');
      $h = hash('sha256', $token); $found = null;
      foreach (dbUsers() as $u) if (!empty($u['resetHash']) && hash_equals($u['resetHash'], $h)) $found = $u;
      if (!$found || (int)$found['resetExpires'] < time()) fail('That reset link is not valid any more. Ask for a new one from the sign-in page.');
      $rec = userRecord($found); $rec['hash'] = password_hash($pw, PASSWORD_BCRYPT); $rec['resetHash'] = ''; $rec['resetExpires'] = 0;
      saveUser($rec, 'system');
      out(['ok' => true, 'username' => $rec['username']]);
    }

    case 'user_delete': {
      $me = requireAdmin();
      if ($method !== 'POST') fail('Bad request.');
      seedUsersIfEmpty();
      $username = strtolower(trim((string)($body['username'] ?? '')));
      if ($username === strtolower($me['username'])) fail('You cannot remove your own login.');
      if (!findUser($username)) fail('That login does not exist.');
      store()->apply([['op' => 'del', 'collection' => 'users', 'id' => $username]], $me['name']);
      out(['ok' => true]);
    }

    case 'password': {
      $me = requireUser();
      if ($method !== 'POST') fail('Bad request.');
      seedUsersIfEmpty();
      $u = findUser($me['username']);
      if (!$u || !password_verify((string)($body['current'] ?? ''), $u['hash'])) fail('Your current password is not correct.');
      $pw = (string)($body['password'] ?? '');
      if (strlen($pw) < 8) fail('Please choose a password of at least 8 characters.');
      $rec = userRecord($u); $rec['hash'] = password_hash($pw, PASSWORD_BCRYPT);
      saveUser($rec, $me['name']);
      out(['ok' => true]);
    }

    case 'version':
      requireUser();
      out(['ok' => true, 'version' => store()->version()]);

    case 'load': {
      requireUser();
      $s = store();
      $data = $s->all(); unset($data['users']);   // password hashes never leave the server
      out(['ok' => true, 'version' => $s->version(), 'data' => $data, 'defaults' => ['team' => teamDefault()]]);
    }

    case 'batch': {
      $u = requireUser();
      if ($method !== 'POST') fail('Bad request.');
      $ops = $body['ops'] ?? null;
      if (!is_array($ops) || count($ops) > 5000) fail('Bad request.');
      foreach ($ops as $op) {
        if (!in_array($op['op'] ?? '', ['put', 'del'], true) || !in_array($op['collection'] ?? '', COLLECTIONS, true) || $op['collection'] === 'users' || !$validId($op['id'] ?? null)) fail('Bad request.');
        if ($op['op'] === 'put' && (!is_array($op['record'] ?? null) || ($op['record']['id'] ?? null) !== $op['id'])) fail('Bad request.');
        if ($op['op'] === 'del' && $op['collection'] === 'physicians' && ($u['role'] ?? '') !== 'admin') fail('Only the administrator can delete a physician.', 403);
      }
      out(['ok' => true, 'version' => store()->apply($ops, $u['name'])]);
    }

    case 'replace': {
      $u = requireAdmin();
      if ($method !== 'POST') fail('Bad request.');
      $data = $body['data'] ?? null;
      if (!is_array($data)) fail('Bad request.');
      $clean = ['users' => dbUsers()];   // a backup never touches logins
      foreach (COLLECTIONS as $c) if ($c !== 'users') foreach (($data[$c] ?? []) as $row) if (is_array($row) && $validId($row['id'] ?? null)) $clean[$c][] = $row;
      out(['ok' => true, 'version' => store()->replace($clean, $u['name'])]);
    }

    case 'clear': {
      $u = requireAdmin();
      if ($method !== 'POST') fail('Bad request.');
      foreach (glob("$DATA/files/*") ?: [] as $f) @unlink($f);
      out(['ok' => true, 'version' => store()->replace(['users' => dbUsers()], $u['name'])]);
    }

    case 'upload': {
      requireUser();
      if ($method !== 'POST') fail('Bad request.');
      $id = $_POST['id'] ?? '';
      if (!$validId($id) || empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) fail('The file could not be uploaded.');
      if ($_FILES['file']['size'] > $CFG['max_file_mb'] * 1048576) fail('That file is larger than ' . $CFG['max_file_mb'] . ' MB.');
      $name = preg_replace('/[^\w .()\-]+/u', '_', (string)$_FILES['file']['name']) ?: 'file';
      if (!move_uploaded_file($_FILES['file']['tmp_name'], "$DATA/files/$id.bin")) fail('The file could not be saved on the server.', 500);
      file_put_contents("$DATA/files/$id.json", json_encode(['name' => $name, 'type' => (string)($_FILES['file']['type'] ?: 'application/octet-stream'), 'size' => (int)$_FILES['file']['size']]));
      out(['ok' => true]);
    }

    case 'file': {
      requireUser();
      $id = $_GET['id'] ?? '';
      if (!$validId($id) || !is_file("$DATA/files/$id.bin")) fail('File not found.', 404);
      $meta = json_decode((string)file_get_contents("$DATA/files/$id.json"), true) ?: ['name' => 'file', 'type' => 'application/octet-stream'];
      header('Content-Type: ' . $meta['type']);
      header('Content-Length: ' . filesize("$DATA/files/$id.bin"));
      header('Content-Disposition: attachment; filename="' . str_replace('"', '', $meta['name']) . '"');
      header('X-Content-Type-Options: nosniff');
      header('Cache-Control: private, no-store');
      readfile("$DATA/files/$id.bin");
      exit;
    }

    case 'delfile': {
      requireUser();
      if ($method !== 'POST') fail('Bad request.');
      $id = $body['id'] ?? '';
      if ($validId($id)) { @unlink("$DATA/files/$id.bin"); @unlink("$DATA/files/$id.json"); }
      out(['ok' => true]);
    }

    case 'hash': {
      requireAdmin();
      if ($method !== 'POST') fail('Bad request.');
      $pw = (string)($body['password'] ?? '');
      if (strlen($pw) < 8) fail('Use at least 8 characters.');
      out(['ok' => true, 'hash' => password_hash($pw, PASSWORD_BCRYPT)]);
    }

    default:
      fail('Unknown action.', 404);
  }
} catch (Throwable $e) {
  error_log('physician-relations: ' . $e->getMessage());
  fail('Something went wrong on the server: ' . $e->getMessage(), 500);
}
