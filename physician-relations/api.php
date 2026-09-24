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

const APP_ID = 'nwsh-physician-relations';
const COLLECTIONS = ['physicians', 'contacts', 'referrals', 'settings'];

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

/* ---------- storage: SQLite, with a plain JSON file as fallback ---------- */
interface Store {
  public function version(): int;
  public function all(): array;
  public function apply(array $ops, string $by): int;
  public function replace(array $data, string $by): int;
}

class SqliteStore implements Store {
  private PDO $pdo;
  public function __construct(string $file) {
    $this->pdo = new PDO('sqlite:' . $file);
    $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $this->pdo->exec('PRAGMA journal_mode=WAL');
    $this->pdo->exec('PRAGMA busy_timeout=5000');
    $this->pdo->exec('CREATE TABLE IF NOT EXISTS records (collection TEXT NOT NULL, id TEXT NOT NULL, json TEXT NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT, PRIMARY KEY (collection, id))');
    $this->pdo->exec('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)');
    $this->pdo->exec("INSERT OR IGNORE INTO meta (key, value) VALUES ('version', '0')");
  }
  public function version(): int { return (int)$this->pdo->query("SELECT value FROM meta WHERE key='version'")->fetchColumn(); }
  public function all(): array {
    $out = array_fill_keys(COLLECTIONS, []);
    foreach ($this->pdo->query('SELECT collection, json FROM records') as $r) $out[$r['collection']][] = json_decode($r['json'], true);
    return $out;
  }
  private function bump(): int { $this->pdo->exec("UPDATE meta SET value = CAST(value AS INTEGER) + 1 WHERE key='version'"); return $this->version(); }
  public function apply(array $ops, string $by): int {
    $this->pdo->beginTransaction();
    try {
      $put = $this->pdo->prepare('INSERT INTO records (collection, id, json, updated_at, updated_by) VALUES (?, ?, ?, ?, ?) ON CONFLICT(collection, id) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at, updated_by = excluded.updated_by');
      $del = $this->pdo->prepare('DELETE FROM records WHERE collection = ? AND id = ?');
      $now = gmdate('c');
      foreach ($ops as $op) {
        if ($op['op'] === 'put') $put->execute([$op['collection'], $op['id'], json_encode($op['record'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $now, $by]);
        else $del->execute([$op['collection'], $op['id']]);
      }
      $v = $this->bump();
      $this->pdo->commit();
      return $v;
    } catch (Throwable $e) { $this->pdo->rollBack(); throw $e; }
  }
  public function replace(array $data, string $by): int {
    $this->pdo->beginTransaction();
    try {
      $this->pdo->exec('DELETE FROM records');
      $put = $this->pdo->prepare('INSERT INTO records (collection, id, json, updated_at, updated_by) VALUES (?, ?, ?, ?, ?)');
      $now = gmdate('c');
      foreach ($data as $coll => $rows) foreach ($rows as $row) $put->execute([$coll, $row['id'], json_encode($row, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $now, $by]);
      $v = $this->bump();
      $this->pdo->commit();
      return $v;
    } catch (Throwable $e) { $this->pdo->rollBack(); throw $e; }
  }
}

class JsonStore implements Store {
  private string $file; private array $d; private $fh;
  public function __construct(string $file) {
    $this->file = $file;
    $this->fh = fopen($file, 'c+');
    flock($this->fh, LOCK_EX);
    $raw = stream_get_contents($this->fh);
    $this->d = $raw ? (json_decode($raw, true) ?: []) : [];
    $this->d += ['version' => 0, 'records' => []];
  }
  private function save(): void { rewind($this->fh); ftruncate($this->fh, 0); fwrite($this->fh, json_encode($this->d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)); fflush($this->fh); }
  public function version(): int { return (int)$this->d['version']; }
  public function all(): array {
    $out = array_fill_keys(COLLECTIONS, []);
    foreach ($this->d['records'] as $key => $row) { [$coll] = explode('/', $key, 2); $out[$coll][] = $row; }
    return $out;
  }
  public function apply(array $ops, string $by): int {
    foreach ($ops as $op) { $k = $op['collection'] . '/' . $op['id']; if ($op['op'] === 'put') $this->d['records'][$k] = $op['record']; else unset($this->d['records'][$k]); }
    $this->d['version']++; $this->save(); return $this->d['version'];
  }
  public function replace(array $data, string $by): int {
    $this->d['records'] = [];
    foreach ($data as $coll => $rows) foreach ($rows as $row) $this->d['records'][$coll . '/' . $row['id']] = $row;
    $this->d['version']++; $this->save(); return $this->d['version'];
  }
}

function store(): Store {
  global $DATA;
  static $s = null;
  if ($s) return $s;
  if (class_exists('PDO') && in_array('sqlite', PDO::getAvailableDrivers(), true)) $s = new SqliteStore("$DATA/physician-relations.sqlite");
  else $s = new JsonStore("$DATA/physician-relations.json");
  return $s;
}

/* ---------- session / auth ---------- */
$secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
session_name('nwshpr');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $secure, 'httponly' => true, 'samesite' => 'Lax']);
ini_set('session.gc_maxlifetime', (string)($CFG['idle_minutes'] * 60 * 2));
session_start();

function findUser(string $username): ?array {
  global $CFG;
  foreach ($CFG['users'] as $u) if (strcasecmp($u['username'], $username) === 0) return $u;
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
function pub(array $u): array { return ['username' => $u['username'], 'name' => $u['name'], 'role' => $u['role'] ?? 'user']; }
function teamDefault(): array { global $CFG; return array_values(array_map(fn($u) => $u['name'], array_filter($CFG['users'], fn($u) => ($u['team'] ?? true) !== false))); }

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
      if (($u['role'] ?? '') === 'admin') $r['users'] = array_map('pub', $CFG['users']);
      out($r);
    }

    case 'version':
      requireUser();
      out(['ok' => true, 'version' => store()->version()]);

    case 'load': {
      requireUser();
      $s = store();
      out(['ok' => true, 'version' => $s->version(), 'data' => $s->all(), 'defaults' => ['team' => teamDefault()]]);
    }

    case 'batch': {
      $u = requireUser();
      if ($method !== 'POST') fail('Bad request.');
      $ops = $body['ops'] ?? null;
      if (!is_array($ops) || count($ops) > 5000) fail('Bad request.');
      foreach ($ops as $op) {
        if (!in_array($op['op'] ?? '', ['put', 'del'], true) || !in_array($op['collection'] ?? '', COLLECTIONS, true) || !$validId($op['id'] ?? null)) fail('Bad request.');
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
      $clean = [];
      foreach (COLLECTIONS as $c) foreach (($data[$c] ?? []) as $row) if (is_array($row) && $validId($row['id'] ?? null)) $clean[$c][] = $row;
      out(['ok' => true, 'version' => store()->replace($clean, $u['name'])]);
    }

    case 'clear': {
      $u = requireAdmin();
      if ($method !== 'POST') fail('Bad request.');
      foreach (glob("$DATA/files/*") ?: [] as $f) @unlink($f);
      out(['ok' => true, 'version' => store()->replace([], $u['name'])]);
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
