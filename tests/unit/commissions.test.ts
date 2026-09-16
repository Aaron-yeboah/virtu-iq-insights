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

test("Daily Commission Snapshots - Locked Historical Rates Preserve Past Numbers", () => {
  // Mock historical day snapshots
  type MockSnapshot = {
    date: string;
    developer_commission_rate: number;
    admin_commission_rate: number;
    revenue_ghs: number;
    is_locked: boolean;
  };

  const snapshots: MockSnapshot[] = [
    {
      date: "2026-08-25",
      developer_commission_rate: 15,
      admin_commission_rate: 15,
      revenue_ghs: 2000,
      is_locked: true,
    },
    {
      date: "2026-08-26",
      developer_commission_rate: 20,
      admin_commission_rate: 10,
      revenue_ghs: 3500,
      is_locked: true,
    },
  ];

  const currentSettings = {
    developer_commission_rate: 30, // Changed today to 30%
    admin_commission_rate: 20,     // Changed today to 20%
  };

  // Helper resolving active rate for any target date
  function resolveRatesForDate(targetDate: string, todayDate: string) {
    const isPast = targetDate < todayDate;
    const snap = snapshots.find((s) => s.date === targetDate);
    if (isPast && snap) {
      return {
        devRate: snap.developer_commission_rate,
        adminRate: snap.admin_commission_rate,
        isLocked: true,
      };
    }
    return {
      devRate: currentSettings.developer_commission_rate,
      adminRate: currentSettings.admin_commission_rate,
      isLocked: false,
    };
  }

  const todayStr = "2026-08-30";

  // Past day 2026-08-25 should stay locked at 15% dev & 15% admin (GHS 300 each), unaffected by current 30% settings
  const day1Rates = resolveRatesForDate("2026-08-25", todayStr);
  assert.equal(day1Rates.devRate, 15);
  assert.equal(day1Rates.adminRate, 15);
  assert.equal(day1Rates.isLocked, true);
  assert.equal(computeCommission(2000, day1Rates.devRate), 300);
  assert.equal(computeCommission(2000, day1Rates.adminRate), 300);

  // Past day 2026-08-26 should stay locked at 20% dev (GHS 700) & 10% admin (GHS 350)
  const day2Rates = resolveRatesForDate("2026-08-26", todayStr);
  assert.equal(day2Rates.devRate, 20);
  assert.equal(day2Rates.adminRate, 10);
  assert.equal(day2Rates.isLocked, true);
  assert.equal(computeCommission(3500, day2Rates.devRate), 700);
  assert.equal(computeCommission(3500, day2Rates.adminRate), 350);

  // Today (2026-08-30) should use the new active settings rate (30% dev, 20% admin)
  const todayRates = resolveRatesForDate("2026-08-30", todayStr);
  assert.equal(todayRates.devRate, 30);
  assert.equal(todayRates.adminRate, 20);
  assert.equal(todayRates.isLocked, false);
  assert.equal(computeCommission(1000, todayRates.devRate), 300);
  assert.equal(computeCommission(1000, todayRates.adminRate), 200);
});

test("Developer Payout Accumulation & Clearance History", () => {
  type Payment = { id: string; amount_ghs: number; created_at: string };
  type DevPayout = { id: string; amount_ghs: number; cleared_at: string; note: string | null };

  const payments: Payment[] = [
    { id: "p1", amount_ghs: 100, created_at: "2026-09-01T10:00:00Z" },
    { id: "p2", amount_ghs: 200, created_at: "2026-09-02T10:00:00Z" },
    { id: "p3", amount_ghs: 300, created_at: "2026-09-03T10:00:00Z" },
  ];

  let devPayoutClearedAt: string | null = null;
  const devPayouts: DevPayout[] = [];
  const devRate = 15; // 15%

  function getUnpaidDevCommission() {
    const eligiblePayments = payments.filter((p) => !devPayoutClearedAt || p.created_at > devPayoutClearedAt);
    const totalRev = eligiblePayments.reduce((acc, p) => acc + p.amount_ghs, 0);
    return computeCommission(totalRev, devRate);
  }

  // Initial state: 3 payments totaling 600 GHS revenue @ 15% dev commission = 90 GHS unpaid
  assert.equal(getUnpaidDevCommission(), 90);

  // Admin clears dev payout on Sept 2 after p1 and p2
  devPayoutClearedAt = "2026-09-02T23:59:59Z";
  devPayouts.push({
    id: "payout-1",
    amount_ghs: 45, // 15% of (100 + 200)
    cleared_at: devPayoutClearedAt,
    note: "MoMo Ref 123",
  });

  // After clearance, unpaid balance only counts p3 (created after Sept 2 clearance) = 15% of 300 = 45 GHS
  assert.equal(getUnpaidDevCommission(), 45);

  // Total paid to date is recorded in history
  const totalPaid = devPayouts.reduce((acc, p) => acc + p.amount_ghs, 0);
  assert.equal(totalPaid, 45);
  assert.equal(devPayouts.length, 1);
  assert.equal(devPayouts[0].note, "MoMo Ref 123");
});

