<?php
/*
  Northwest Specialty Hospital — Physician Relations
  Shared pieces used by api.php and digest.php. Nothing to edit here.
*/
declare(strict_types=1);

const APP_ID = 'nwsh-physician-relations';
const COLLECTIONS = ['physicians', 'contacts', 'referrals', 'tasks', 'settings', 'users'];

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

$MAIL_ERROR = '';
/* Sends through the SMTP mailbox in config.php when one is set up (reliable on shared
   hosting), otherwise through PHP's built-in mail(). $MAIL_ERROR explains a failure. */
function sendMail(string $to, string $subject, string $body): bool {
  global $CFG, $MAIL_ERROR;
  $MAIL_ERROR = '';
  $host = preg_replace('/^www\./', '', explode(':', $_SERVER['HTTP_HOST'] ?? 'localhost')[0]);
  $from = $CFG['mail_from'] ?? ('noreply@' . $host);
  $smtp = $CFG['smtp'] ?? [];
  if (!empty($smtp['host']) && !empty($smtp['user']) && !empty($smtp['pass'])) return smtpSend($smtp, $from, 'Physician Relations', $to, $subject, $body, $MAIL_ERROR);
  $headers = "From: Physician Relations <$from>\r\nReply-To: $from\r\nContent-Type: text/plain; charset=UTF-8\r\nX-Mailer: PHP\r\n";
  $ok = @mail($to, $subject, $body, $headers);
  if (!$ok) $MAIL_ERROR = 'The server\'s built-in mailer refused the message. Set up the SMTP mailbox in config.php.';
  return $ok;
}
function smtpSend(array $s, string $from, string $fromName, string $to, string $subject, string $body, string &$err): bool {
  $host = $s['host']; $port = (int)($s['port'] ?? 465); $secure = strtolower((string)($s['secure'] ?? 'ssl'));
  $ctx = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'SNI_enabled' => true, 'peer_name' => $host]]);
  $fp = @stream_socket_client(($secure === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port, $errno, $errstr, 20, STREAM_CLIENT_CONNECT, $ctx);
  if (!$fp) { $err = "Could not connect to mail server $host:$port — $errstr"; return false; }
  stream_set_timeout($fp, 20);
  $read = function () use ($fp) { $data = ''; while (($line = fgets($fp, 1024)) !== false) { $data .= $line; if (strlen($line) < 4 || $line[3] === ' ') break; } return $data; };
  $cmd = function (?string $c, string $expect) use ($fp, $read, &$err) {
    if ($c !== null) fwrite($fp, $c . "\r\n");
    $r = $read();
    if (substr($r, 0, 3) !== $expect) { $err = 'Mail server said: ' . trim($r ?: '(no reply)'); return false; }
    return true;
  };
  $ehlo = 'EHLO ' . (preg_replace('/[^a-z0-9.-]/i', '', $s['ehlo'] ?? 'docdockcrm.com') ?: 'localhost');
  if (!$cmd(null, '220') || !$cmd($ehlo, '250')) { fclose($fp); return false; }
  if ($secure === 'tls') {
    if (!$cmd('STARTTLS', '220')) { fclose($fp); return false; }
    if (!@stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) { $err = 'Could not start TLS with the mail server.'; fclose($fp); return false; }
    if (!$cmd($ehlo, '250')) { fclose($fp); return false; }
  }
  if (!$cmd('AUTH LOGIN', '334') || !$cmd(base64_encode($s['user']), '334')) { fclose($fp); return false; }
  if (!$cmd(base64_encode($s['pass']), '235')) { $err = 'The mail server rejected the mailbox username or password in config.php.'; fclose($fp); return false; }
  if (!$cmd("MAIL FROM:<$from>", '250') || !$cmd("RCPT TO:<$to>", '250') || !$cmd('DATA', '354')) { fclose($fp); return false; }
  $enc = fn($t) => '=?UTF-8?B?' . base64_encode($t) . '?=';
  $msg = implode("\r\n", [
    'Date: ' . date('r'),
    'From: ' . $enc($fromName) . " <$from>",
    "To: <$to>",
    'Subject: ' . $enc($subject),
    'Message-ID: <' . bin2hex(random_bytes(8)) . '@' . substr(strrchr($from, '@'), 1) . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: Physician Relations',
    '',
    preg_replace('/^\./m', '..', str_replace(["\r\n", "\r"], "\n", $body) === $body ? str_replace("\n", "\r\n", $body) : str_replace("\n", "\r\n", str_replace(["\r\n", "\r"], "\n", $body))),
  ]);
  if (!$cmd($msg . "\r\n.", '250')) { fclose($fp); return false; }
  fwrite($fp, "QUIT\r\n"); fclose($fp);
  return true;
}

