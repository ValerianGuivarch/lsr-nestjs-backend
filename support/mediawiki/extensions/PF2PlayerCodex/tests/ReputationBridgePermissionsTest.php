<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/includes/PF2ReputationBridge.php';

/** Standalone, dependency-free check for the Wiki MJ permission gate. */
final class ReputationStubUser {
 private $rights;
 private $registered;
 public function __construct(bool $registered, array $rights) {
  $this->registered = $registered;
  $this->rights = $rights;
 }
 public function isRegistered(): bool { return $this->registered; }
 public function isAllowed(string $right): bool { return in_array($right, $this->rights, true); }
}
$cases = [
 ['registered PF2 MJ', true, ['pf2sessions-admin'], true],
 ['legacy wiki sysop', true, ['delete'], true],
 ['wiki editor, not MJ', true, ['edit'], false],
 ['registered without rights', true, [], false],
 ['anonymous with synthetic rights', false, ['pf2sessions-admin', 'delete'], false],
];
foreach ($cases as [$name, $registered, $rights, $expected]) {
 $actual = PF2ReputationBridge::isAdmin(new ReputationStubUser($registered, $rights));
 if ($actual !== $expected) {
  fwrite(STDERR, "FAIL {$name}: expected ".($expected?'true':'false')."\n");
  exit(1);
 }
}
echo "Wiki reputation permissions: PF2 MJ, legacy admins, and non-admins OK\n";
