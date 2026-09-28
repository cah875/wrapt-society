<?php
/*
  Northwest Specialty Hospital — Physician Relations
  Morning email digest.

  Each weekday morning this sends every team member one short email listing
  THEIR overdue follow-ups, follow-ups due this week and referrals at risk.
  People with nothing on their plate get no email. On Mondays administrators
  also get a one-week summary.

  Run it once a day from cPanel → Cron Jobs (see README):
      /usr/local/bin/php /home/YOURACCOUNT/public_html/digest.php
  Options:  --force   send even if it already ran today / it is a weekend
            --dry     print what would be sent instead of sending
            --to=x@y  send everything to one address (for testing)
  It can also be triggered from a URL with the digest_key from config.php:
      https://docdockcrm.com/digest.php?key=...&force=1
*/
declare(strict_types=1);

if (!defined('DIGEST_LIB_ONLY')) { /* fallthrough: normal run below */ }

$CFG = $CFG ?? require __DIR__ . '/config.php';
$DATA = $DATA ?? __DIR__ . '/data';
if (!function_exists('store')) require __DIR__ . '/lib.php';
date_default_timezone_set($CFG['timezone'] ?? 'America/Los_Angeles');

/* ---------- helpers shared with api.php's test button ---------- */
function digestData(): array {
  static $d = null;
  if ($d === null) {
    $all = store()->all();
    $settings = []; foreach ($all['settings'] as $s) if (($s['id'] ?? '') === 'main') $settings = $s;
    $d = ['physicians' => $all['physicians'], 'contacts' => $all['contacts'], 'referrals' => $all['referrals'], 'users' => $all['users'], 'settings' => $settings, 'riskDays' => max(1, (int)($settings['riskDays'] ?? 14))];
  }
  return $d;
}
function dName(array $p): string { return trim('Dr. ' . ($p['firstName'] ?? '') . ' ' . ($p['lastName'] ?? '')) . (!empty($p['credentials']) ? ', ' . $p['credentials'] : ''); }
function dPhys(string $id): ?array { foreach (digestData()['physicians'] as $p) if ($p['id'] === $id) return $p; return null; }
function dDays(string $a, string $b): int { return (int)round((strtotime($b . ' 00:00:00') - strtotime($a . ' 00:00:00')) / 86400); }
function dFmt(string $iso): string { return $iso ? date('D, M j', strtotime($iso . ' 00:00:00')) : '—'; }
function refLastDate(array $r): string {
  $l = end($r['legs']); if (!$l) return substr($r['createdAt'] ?? date('c'), 0, 10);
  $ds = array_filter([$l['sentDate'] ?? '', $l['scheduledDate'] ?? '', $l['completedDate'] ?? '', $l['resultedDate'] ?? '', $l['lostDate'] ?? '']); sort($ds);
  return $ds ? end($ds) : date('Y-m-d');
}
function refRisk(array $r): string {
  if (($r['status'] ?? 'active') !== 'active' || empty($r['legs'])) return '';
  $l = end($r['legs']); $today = date('Y-m-d');
  if (!empty($l['scheduledDate']) && empty($l['completedDate']) && dDays($l['scheduledDate'], $today) > 2) return 'appointment on ' . dFmt($l['scheduledDate']) . ' was never marked as seen';
  if (empty($l['resultedDate'])) { $w = dDays(refLastDate($r), $today); if ($w >= digestData()['riskDays']) return "no movement for $w days"; }
  return '';
}
function refLine(array $r): string {
  $l = end($r['legs']);
  $from = $l['from']['label'] ?? '?'; $to = $l['to']['label'] ?? '?';
  return "Referral #" . substr($r['id'], -6) . " · $from → $to" . (!empty($l['service']) ? " · {$l['service']}" : '');
}

/* Builds one person's digest. Returns null when there is nothing to say. */
function buildDigestFor(array $user, bool $isTest = false): ?array {
  global $CFG;
  $d = digestData(); $today = date('Y-m-d'); $weekEnd = date('Y-m-d', strtotime('+7 days'));
  $url = rtrim($CFG['app_url'] ?? appUrl(), '/');
  $name = $user['name'];
  $overdue = []; $soon = [];
  foreach ($d['contacts'] as $c) {
    if (empty($c['fuDate']) || !empty($c['fuDone']) || ($c['who'] ?? '') !== $name) continue;
    $p = dPhys($c['physicianId'] ?? ''); $who = $p ? dName($p) : 'Unknown physician';
    $ask = trim((string)($c['ask'] ?? '')) ?: trim(mb_substr((string)($c['comm'] ?? ''), 0, 80));
    $line = "• $who — $ask";
    if ($c['fuDate'] < $today) { $n = dDays($c['fuDate'], $today); $overdue[] = [$c['fuDate'], "$line · was due " . dFmt($c['fuDate']) . " ($n day" . ($n === 1 ? '' : 's') . " ago)\n    $url/#/physician/{$c['physicianId']}"]; }
    elseif ($c['fuDate'] <= $weekEnd) $soon[] = [$c['fuDate'], "$line · " . ($c['fuDate'] === $today ? 'today' : dFmt($c['fuDate'])) . "\n    $url/#/physician/{$c['physicianId']}"];
  }
  $risk = [];
  foreach ($d['referrals'] as $r) {
    $why = refRisk($r); if (!$why) continue;
    $owner = $r['owner'] ?? '';
    if ($owner && $owner !== $name) continue;              // assigned to someone else
    $risk[] = "• " . refLine($r) . " · $why" . ($owner ? '' : ' · (unassigned)') . "\n    $url/#/referral/{$r['id']}";
  }
  if (!$overdue && !$soon && !$risk) return null;
  usort($overdue, fn($a, $b) => strcmp($a[0], $b[0])); usort($soon, fn($a, $b) => strcmp($a[0], $b[0]));
  $first = explode(' ', $name)[0];
  $lines = ["Good morning, $first — " . date('l, F j'), ''];
  if ($overdue || $risk) {
    $lines[] = 'NEEDS ATTENTION TODAY';
    foreach ($overdue as $o) $lines[] = 'Overdue follow-up ' . $o[1];
    foreach ($risk as $x) $lines[] = 'Referral at risk ' . $x;
    $lines[] = '';
  }
  if ($soon) { $lines[] = 'DUE THIS WEEK'; foreach ($soon as $s) $lines[] = 'Follow-up ' . $s[1]; $lines[] = ''; }
  $lines[] = "Open Physician Relations: $url";
  $lines[] = '';
  $lines[] = 'You get this because these items are assigned to you. Turn it off in Settings → My login.';
  $n = count($overdue) + count($risk);
  $subject = ($isTest ? '[Test] ' : '') . ($n ? ($n === 1 ? '1 item needs' : "$n items need") . ' attention today' : count($soon) . ' follow-up' . (count($soon) === 1 ? '' : 's') . ' due this week') . ' — Physician Relations';
  return ['subject' => $subject, 'body' => implode("\n", $lines)];
}

/* Monday summary for administrators */
function buildWeeklySummary(): array {
  global $CFG;
  $d = digestData(); $today = date('Y-m-d'); $weekAgo = date('Y-m-d', strtotime('-7 days'));
  $url = rtrim($CFG['app_url'] ?? appUrl(), '/');
  $byPerson = [];
  foreach ($d['contacts'] as $c) if (!empty($c['fuDate']) && empty($c['fuDone']) && $c['fuDate'] < $today) $byPerson[$c['who'] ?? '?'] = ($byPerson[$c['who'] ?? '?'] ?? 0) + 1;
  arsort($byPerson);
  $active = 0; $risk = 0; $done = 0; $lost = 0;
  foreach ($d['referrals'] as $r) {
    $st = $r['status'] ?? 'active';
    if ($st === 'active') { $active++; if (refRisk($r)) $risk++; }
    elseif (substr((string)($r['closedAt'] ?? ''), 0, 10) >= $weekAgo) { if ($st === 'complete') $done++; else $lost++; }
  }
  $newContacts = count(array_filter($d['contacts'], fn($c) => ($c['date'] ?? '') >= $weekAgo));
  $lines = ['Physician Relations — week in review (' . date('M j', strtotime($weekAgo)) . ' – ' . date('M j') . ')', ''];
  $lines[] = "Contacts logged this week: $newContacts";
  $lines[] = "Overdue follow-ups right now: " . array_sum($byPerson);
  foreach ($byPerson as $who => $n) $lines[] = "  • $who: $n";
  $lines[] = '';
  $lines[] = "Referrals in progress: $active (at risk: $risk)";
  $lines[] = "Completed this week: $done · Dropped out this week: $lost";
  $lines[] = '';
  $lines[] = "Open Physician Relations: $url";
  return ['subject' => 'Weekly summary — Physician Relations', 'body' => implode("\n", $lines)];
}

/* ---------- normal run (cron or URL) ---------- */
if (defined('DIGEST_LIB_ONLY')) return;
if (PHP_SAPI !== 'cli') {
  // Only allow a URL run with the secret key from config.php
  if (empty($CFG['digest_key']) || $CFG['digest_key'] === 'change-this-to-a-long-random-phrase' || !hash_equals($CFG['digest_key'], (string)($_GET['key'] ?? ''))) { http_response_code(403); exit('Forbidden'); }
  header('Content-Type: text/plain; charset=utf-8');
}
$args = PHP_SAPI === 'cli' ? array_slice($argv, 1) : array_map(fn($k, $v) => "--$k" . ($v === '1' || $v === '' ? '' : "=$v"), array_keys($_GET), $_GET);
$force = in_array('--force', $args, true); $dry = in_array('--dry', $args, true); $to = null;
foreach ($args as $a) if (str_starts_with($a, '--to=')) $to = substr($a, 5);

$today = date('Y-m-d');
$log = null; foreach (store()->all()['settings'] as $s) if (($s['id'] ?? '') === 'digest') $log = $s;
if (!$force) {
  if ((int)date('N') >= 6) exit("Weekend — nothing sent.\n");
  if (($log['lastRun'] ?? '') === $today) exit("Already ran today ({$log['lastRunAt']}) — nothing sent. Use --force to send again.\n");
}
$sent = []; $skipped = [];
foreach (digestData()['users'] as $u) {
  if (($u['digest'] ?? true) === false) { $skipped[] = "{$u['name']} (opted out)"; continue; }
  if (empty($u['email'])) { $skipped[] = "{$u['name']} (no email)"; continue; }
  $d = buildDigestFor($u);
  if (!$d) { $skipped[] = "{$u['name']} (nothing to report)"; continue; }
  $addr = $to ?: $u['email'];
  if ($dry) { echo "---- To: {$u['name']} <$addr>\nSubject: {$d['subject']}\n\n{$d['body']}\n\n"; $sent[] = $u['name']; continue; }
  if (sendMail($addr, $d['subject'], $d['body'])) $sent[] = $u['name']; else $skipped[] = "{$u['name']} (mail failed: $MAIL_ERROR)";
}
if ((int)date('N') === 1 || $force) {
  $w = buildWeeklySummary();
  foreach (digestData()['users'] as $u) {
    if (($u['role'] ?? '') !== 'admin' || empty($u['email']) || ($u['digest'] ?? true) === false) continue;
    $addr = $to ?: $u['email'];
    if ($dry) { echo "---- Weekly summary to: {$u['name']} <$addr>\nSubject: {$w['subject']}\n\n{$w['body']}\n\n"; continue; }
    sendMail($addr, $w['subject'], $w['body']);
  }
}
if (!$dry) store()->apply([['op' => 'put', 'collection' => 'settings', 'id' => 'digest', 'record' => ['id' => 'digest', 'lastRun' => $today, 'lastRunAt' => date('g:i A'), 'sent' => $sent, 'skipped' => $skipped]]], 'digest');
echo ($dry ? "DRY RUN — " : '') . "Sent: " . (count($sent) ? implode(', ', $sent) : 'nobody') . "\nSkipped: " . (count($skipped) ? implode('; ', $skipped) : 'none') . "\n";
