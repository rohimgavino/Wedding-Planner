import assert from 'node:assert/strict';

// Mock localStorage environment for Node.js test runner
const store = new Map();
global.window = {
  localStorage: {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, val) { store.set(key, String(val)); },
    removeItem(key) { store.delete(key); },
    clear() { store.clear(); },
  },
};
global.localStorage = global.window.localStorage;

// Dynamic import of auth-policy module
const {
  SESSION_DURATION_MS,
  SESSION_WARNING_BEFORE_MS,
  SESSION_KEYS,
  initSessionLimit,
  clearSessionLimit,
  getSessionExpiration,
  isSessionLimitExpired,
  formatRemainingTime,
} = await import('../src/lib/auth-policy.ts');

console.log('--- Testing Pocket Wedding Session Limit & Auto-Logout Logic ---');

// Test 1: Verify 1 hour duration constant
assert.equal(SESSION_DURATION_MS, 60 * 60 * 1000, 'SESSION_DURATION_MS must be exactly 1 hour (3,600,000 ms)');
assert.equal(SESSION_WARNING_BEFORE_MS, 5 * 60 * 1000, 'SESSION_WARNING_BEFORE_MS must be 5 minutes (300,000 ms)');
console.log('PASS 1: Session constants match exact 1-hour requirement');

// Test 2: initSessionLimit initializes localStorage correctly
store.clear();
const uid = 'user-1234-abcd';
const session = initSessionLimit(uid);
assert.equal(session.userId, uid);
assert.equal(session.isExpired, false);
assert.equal(session.isWarning, false);
assert.ok(session.remainingMs <= SESSION_DURATION_MS && session.remainingMs > SESSION_DURATION_MS - 1000);
assert.equal(store.get(SESSION_KEYS.USER_ID), uid);
assert.ok(store.get(SESSION_KEYS.EXPIRES_AT));
assert.ok(store.get(SESSION_KEYS.LOGIN_TIME));
console.log('PASS 2: initSessionLimit correctly records 1-hour session expiration');

// Test 3: getSessionExpiration respects active session
const active = getSessionExpiration(uid);
assert.ok(active);
assert.equal(active.isExpired, false);
assert.equal(active.userId, uid);
assert.equal(isSessionLimitExpired(uid), false);
console.log('PASS 3: Active session within 1-hour limit is recognized as valid');

// Test 4: getSessionExpiration detects 5-minute warning state
const mockExpiringSoon = Date.now() + (3 * 60 * 1000); // 3 minutes remaining
store.set(SESSION_KEYS.EXPIRES_AT, String(mockExpiringSoon));
const warningSession = getSessionExpiration(uid);
assert.ok(warningSession);
assert.equal(warningSession.isExpired, false);
assert.equal(warningSession.isWarning, true, 'Must flag isWarning when remaining time is <= 5 minutes');
console.log('PASS 4: Warning state triggered within 5-minute window');

// Test 5: getSessionExpiration detects expired session (> 1 hour)
const mockExpired = Date.now() - 1000; // 1 second ago
store.set(SESSION_KEYS.EXPIRES_AT, String(mockExpired));
const expiredSession = getSessionExpiration(uid);
assert.ok(expiredSession);
assert.equal(expiredSession.isExpired, true, 'Must report isExpired when current time >= expiresAt');
assert.equal(expiredSession.remainingMs, 0);
assert.equal(isSessionLimitExpired(uid), true);
console.log('PASS 5: Expired session (> 1 hour) is detected accurately for auto-logout');

// Test 6: formatRemainingTime formats accurately
assert.equal(formatRemainingTime(3600000), '60m 00s');
assert.equal(formatRemainingTime(59 * 60 * 1000 + 45 * 1000), '59m 45s');
assert.equal(formatRemainingTime(4 * 60 * 1000 + 5 * 1000), '4m 05s');
assert.equal(formatRemainingTime(30000), '30s');
assert.equal(formatRemainingTime(0), '0s');
console.log('PASS 6: formatRemainingTime produces clear user-friendly countdown strings');

// Test 7: User switch / mismatch re-initializes 1-hour limit for new user
const uid2 = 'user-5678-efgh';
const switched = getSessionExpiration(uid2);
assert.ok(switched);
assert.equal(switched.userId, uid2);
assert.equal(switched.isExpired, false);
assert.equal(store.get(SESSION_KEYS.USER_ID), uid2);
console.log('PASS 7: User mismatch or switch resets session limit safely for the new user');

// Test 8: clearSessionLimit cleans up all keys and preserves optional reason
clearSessionLimit('session_expired');
assert.equal(store.has(SESSION_KEYS.LOGIN_TIME), false);
assert.equal(store.has(SESSION_KEYS.EXPIRES_AT), false);
assert.equal(store.has(SESSION_KEYS.USER_ID), false);
assert.equal(store.get(SESSION_KEYS.REASON), 'session_expired');

clearSessionLimit();
assert.equal(store.has(SESSION_KEYS.REASON), false);
console.log('PASS 8: clearSessionLimit cleans up session storage and propagates expiry reason');

console.log('\n========================================================');
console.log('ALL 8 SESSION LIMIT TESTS PASSED (1-HOUR LIMIT & AUTO-LOGOUT VERIFIED)!');
console.log('========================================================\n');
