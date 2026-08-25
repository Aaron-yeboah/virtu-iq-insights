import test from "node:test";
import assert from "node:assert/strict";

function computeCommission(revenue: number, ratePercent: number): number {
  const safeRate = Math.min(100, Math.max(0, ratePercent));
  return Number(((revenue * safeRate) / 100).toFixed(2));
}

test("Commission Calculations - Standard & Boundary Cases", () => {
  const totalRevenue = 15000;

  // Developer Commission at 65%
  const devComm = computeCommission(totalRevenue, 65);
  assert.equal(devComm, 9750);

  // Admin Commission at 25%
  const adminComm = computeCommission(totalRevenue, 25);
  assert.equal(adminComm, 3750);

  // Partner Commission at 10%
  const partnerComm = computeCommission(totalRevenue, 10);
  assert.equal(partnerComm, 1500);

  // Sum of default splits (65 + 25 + 10 = 100%)
  assert.equal(devComm + adminComm + partnerComm, totalRevenue);
});

test("Commission Calculations - Decimal & Boundary clamping", () => {
  // Clamping negative rates
  assert.equal(computeCommission(1000, -10), 0);

  // Clamping rates over 100%
  assert.equal(computeCommission(1000, 150), 1000);

  // Decimal rate precision
  assert.equal(computeCommission(125.50, 12.5), 15.69);
});
