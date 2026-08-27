import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("recovery codes are one-time, hashed, and revoke existing sessions", async () => {
  const [server, route, schema, flow] = await Promise.all([
    readFile(new URL("../app/auth-server.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/AuthFlow.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(server, /replaceRecoveryCodes/);
  assert.match(server, /hashRecoveryCode/);
  assert.match(server, /code_hash TEXT NOT NULL/);
  assert.doesNotMatch(server, /recovery_code TEXT/);
  assert.match(route, /auth_recovery_codes\.used_at IS NULL/);
  assert.match(route, /DELETE FROM auth_sessions WHERE user_id = \?/);
  assert.match(schema, /authRecoveryCodes/);
  assert.match(flow, /忘记密码？/);
  assert.match(flow, /验证恢复码并重设密码/);
});
