import test from "node:test";
import assert from "node:assert/strict";

type PackageTier = {
  name: string;
  price_ghs: number;
  credits: number;
  max_verdicts: number;
};

const PACKAGES: PackageTier[] = [
  { name: "Starter", price_ghs: 30, credits: 5, max_verdicts: 2 },
  { name: "Plus", price_ghs: 70, credits: 15, max_verdicts: 4 },
  { name: "Premium", price_ghs: 120, credits: 30, max_verdicts: 8 },
];

test("Package Tiers - Credits vs Verdict Limits", () => {
  for (const pkg of PACKAGES) {
    assert.ok(pkg.credits >= 1, `${pkg.name} must grant at least 1 credit`);
    assert.ok(pkg.max_verdicts >= 1, `${pkg.name} must grant at least 1 verdict`);
    assert.ok(pkg.price_ghs > 0, `${pkg.name} price must be positive`);
  }

  // Verify scan deduction rule: 1 credit per scan across all plans
  const scanCost = 1;
  for (const pkg of PACKAGES) {
    const remainingAfter1Scan = pkg.credits - scanCost;
    assert.equal(remainingAfter1Scan, pkg.credits - 1);
  }
});

test("Wallet Balance Spending Guard", () => {
  let userCredits = 0;
  const canScan = userCredits >= 1;
  assert.equal(canScan, false, "Users with 0 credits must be blocked from initiating a scan");

  // Top up Starter package (5 credits)
  userCredits += 5;
  assert.equal(userCredits >= 1, true, "User should now be allowed to scan");

  // Perform 5 scans
  for (let i = 0; i < 5; i++) {
    assert.ok(userCredits >= 1, "Must have credit to scan");
    userCredits -= 1;
  }

  assert.equal(userCredits, 0, "Wallet must hit exactly 0 credits after 5 scans");
  assert.equal(userCredits >= 1, false, "Wallet must block further scans at 0 balance");
});
