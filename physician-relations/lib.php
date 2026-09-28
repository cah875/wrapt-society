<?php
/*
  Northwest Specialty Hospital — Physician Relations
  Shared pieces used by api.php and digest.php. Nothing to edit here.
*/
declare(strict_types=1);

const APP_ID = 'nwsh-physician-relations';
const COLLECTIONS = ['physicians', 'contacts', 'referrals', 'settings', 'users'];

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

function appUrl(): string {
  global $CFG;
  if (!empty($CFG['app_url'])) return rtrim($CFG['app_url'], '/');
  $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
  $dir = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/'), '/');
  return 'https://' . $host . $dir;
}

function sendMail(string $to, string $subject, string $body): bool {
  global $CFG;
  $host = preg_replace('/^www\./', '', explode(':', $_SERVER['HTTP_HOST'] ?? 'localhost')[0]);
  $from = $CFG['mail_from'] ?? ('noreply@' . $host);
  $headers = "From: Physician Relations <$from>\r\nReply-To: $from\r\nContent-Type: text/plain; charset=UTF-8\r\nX-Mailer: PHP\r\n";
  return @mail($to, $subject, $body, $headers);
}

