import test from "node:test";
import assert from "node:assert/strict";
import { formatCredits, formatPeriod, isTokenPlanEndpoint, usagePercent } from "../lib/mimo-api.js";

test("format: credits use 亿/万 units", () => {
  assert.equal(formatCredits(71492410796), "714.9 亿");
  assert.equal(formatCredits(82000000000), "820 亿");
  assert.equal(formatCredits(123456), "12.3 万");
  assert.equal(formatCredits(999), "999");
  assert.equal(formatCredits(0), "0");
});

test("format: period parses UTC strings and counts days left", () => {
  const now = Date.UTC(2026, 10, 20, 12, 0, 0); // 2026-11-20
  const period = formatPeriod("2026-11-01 00:15:42", "2026-12-01 15:59:59", now);
  assert.equal(period.valid, true);
  assert.equal(period.daysLeft, 12); // 2026-12-01 minus 2026-11-20
  assert.ok(period.label.includes("11-01"));
  assert.ok(period.label.includes("12-01"));
});

test("format: period falls back to raw strings when unparseable", () => {
  const period = formatPeriod("n/a", "later", Date.now());
  assert.equal(period.valid, false);
  assert.equal(period.daysLeft, null);
});

test("format: usage percent stays clamped and precise", () => {
  assert.equal(usagePercent({ totalCredits: 82000000000, usedCredits: 10507589204 }), 12.8);
  assert.equal(usagePercent({ totalCredits: 0, usedCredits: 5 }), 0);
  assert.equal(usagePercent({ totalCredits: 10, usedCredits: 99 }), 100);
});

test("format: token-plan endpoint detection covers OAuth-shaped keys", () => {
  assert.equal(isTokenPlanEndpoint("https://token-plan-cn.xiaomimimo.com/v1"), true);
  assert.equal(isTokenPlanEndpoint("https://api.xiaomimimo.com/v1"), false);
  assert.equal(isTokenPlanEndpoint(""), false);
});
