import { describe, it, expect } from "vitest";
import {
  Decimal,
  toDecimal,
  formatMoney,
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  calculateSharesSplit,
  calculateSplit,
  calculateNetBalances,
  simplifyDebts,
  getUserNetBalance,
} from "@/lib/money";

describe("toDecimal", () => {
  it("converts string to Decimal", () => {
    expect(toDecimal("10.50").toString()).toBe("10.5");
  });

  it("converts number to Decimal", () => {
    expect(toDecimal(10.5).toString()).toBe("10.5");
  });
});

describe("formatMoney", () => {
  it("formats positive amount", () => {
    expect(formatMoney("25.5", "USD")).toBe("$25.50");
  });

  it("formats negative amount", () => {
    expect(formatMoney("-10.00", "USD")).toBe("-$10.00");
  });

  it("handles different currencies", () => {
    expect(formatMoney("100", "EUR")).toBe("€100.00");
    expect(formatMoney("100", "GBP")).toBe("£100.00");
  });
});

describe("calculateEqualSplit", () => {
  it("splits equally among 3 people", () => {
    const result = calculateEqualSplit(toDecimal("30"), ["a", "b", "c"]);
    expect(result).toHaveLength(3);
    expect(result[0].amount.toString()).toBe("10");
    expect(result[1].amount.toString()).toBe("10");
    expect(result[2].amount.toString()).toBe("10");
  });

  it("handles remainder correctly with 3 people and $10", () => {
    const result = calculateEqualSplit(toDecimal("10"), ["a", "b", "c"]);
    expect(result).toHaveLength(3);
    const total = result.reduce((sum, r) => sum.plus(r.amount), new Decimal(0));
    expect(total.toString()).toBe("10");
    expect(result[0].amount.toString()).toBe("3.34");
    expect(result[1].amount.toString()).toBe("3.33");
    expect(result[2].amount.toString()).toBe("3.33");
  });

  it("handles 2-person split", () => {
    const result = calculateEqualSplit(toDecimal("100.01"), ["a", "b"]);
    const total = result.reduce((sum, r) => sum.plus(r.amount), new Decimal(0));
    expect(total.toString()).toBe("100.01");
  });

  it("handles single person", () => {
    const result = calculateEqualSplit(toDecimal("99.99"), ["a"]);
    expect(result[0].amount.toString()).toBe("99.99");
  });

  it("throws for empty participants", () => {
    expect(() => calculateEqualSplit(toDecimal("10"), [])).toThrow();
  });
});

describe("calculateExactSplit", () => {
  it("validates exact amounts match total", () => {
    const result = calculateExactSplit(toDecimal("100"), [
      { userId: "a", amount: "60" },
      { userId: "b", amount: "40" },
    ]);
    expect(result[0].amount.toString()).toBe("60");
    expect(result[1].amount.toString()).toBe("40");
  });

  it("throws when amounts don't match total", () => {
    expect(() =>
      calculateExactSplit(toDecimal("100"), [
        { userId: "a", amount: "60" },
        { userId: "b", amount: "30" },
      ])
    ).toThrow("don't equal total");
  });
});

describe("calculatePercentageSplit", () => {
  it("splits by percentage", () => {
    const result = calculatePercentageSplit(toDecimal("200"), [
      { userId: "a", percentage: "60" },
      { userId: "b", percentage: "40" },
    ]);
    const total = result.reduce((sum, r) => sum.plus(r.amount), new Decimal(0));
    expect(total.toString()).toBe("200");
    expect(result[0].amount.toString()).toBe("120");
    expect(result[1].amount.toString()).toBe("80");
  });

  it("handles fractional percentages with remainder", () => {
    const result = calculatePercentageSplit(toDecimal("100"), [
      { userId: "a", percentage: "33.33" },
      { userId: "b", percentage: "33.33" },
      { userId: "c", percentage: "33.34" },
    ]);
    const total = result.reduce((sum, r) => sum.plus(r.amount), new Decimal(0));
    expect(total.toString()).toBe("100");
  });

  it("throws when percentages don't sum to 100", () => {
    expect(() =>
      calculatePercentageSplit(toDecimal("100"), [
        { userId: "a", percentage: "50" },
        { userId: "b", percentage: "30" },
      ])
    ).toThrow("must sum to 100");
  });
});

describe("calculateSharesSplit", () => {
  it("splits by shares/ratio", () => {
    const result = calculateSharesSplit(toDecimal("100"), [
      { userId: "a", shares: 2 },
      { userId: "b", shares: 1 },
      { userId: "c", shares: 1 },
    ]);
    const total = result.reduce((sum, r) => sum.plus(r.amount), new Decimal(0));
    expect(total.toString()).toBe("100");
    expect(result[0].amount.toString()).toBe("50");
    expect(result[1].amount.toString()).toBe("25");
    expect(result[2].amount.toString()).toBe("25");
  });

  it("handles uneven share distribution", () => {
    const result = calculateSharesSplit(toDecimal("100"), [
      { userId: "a", shares: 1 },
      { userId: "b", shares: 1 },
      { userId: "c", shares: 1 },
    ]);
    const total = result.reduce((sum, r) => sum.plus(r.amount), new Decimal(0));
    expect(total.toString()).toBe("100");
  });
});

describe("calculateSplit", () => {
  it("dispatches to correct split function", () => {
    const equal = calculateSplit("EQUAL", toDecimal("30"), [
      { userId: "a" },
      { userId: "b" },
      { userId: "c" },
    ]);
    expect(equal).toHaveLength(3);

    const exact = calculateSplit("EXACT", toDecimal("100"), [
      { userId: "a", amount: "70" },
      { userId: "b", amount: "30" },
    ]);
    expect(exact[0].amount.toString()).toBe("70");
  });
});

describe("calculateNetBalances", () => {
  it("calculates simple balance between two users", () => {
    const expenses = [
      {
        payers: [{ userId: "alice", amount: toDecimal("100") }],
        splits: [
          { userId: "alice", amount: toDecimal("50") },
          { userId: "bob", amount: toDecimal("50") },
        ],
      },
    ];

    const balanceMap = calculateNetBalances(expenses, []);
    const bobBalance = getUserNetBalance("bob", balanceMap);
    expect(bobBalance.youOwe.toString()).toBe("50");
    expect(bobBalance.youAreOwed.toString()).toBe("0");

    const aliceBalance = getUserNetBalance("alice", balanceMap);
    expect(aliceBalance.youAreOwed.toString()).toBe("50");
    expect(aliceBalance.youOwe.toString()).toBe("0");
  });

  it("handles multiple expenses", () => {
    const expenses = [
      {
        payers: [{ userId: "alice", amount: toDecimal("60") }],
        splits: [
          { userId: "alice", amount: toDecimal("20") },
          { userId: "bob", amount: toDecimal("20") },
          { userId: "carol", amount: toDecimal("20") },
        ],
      },
      {
        payers: [{ userId: "bob", amount: toDecimal("30") }],
        splits: [
          { userId: "alice", amount: toDecimal("15") },
          { userId: "bob", amount: toDecimal("15") },
        ],
      },
    ];

    const balanceMap = calculateNetBalances(expenses, []);
    const aliceBalance = getUserNetBalance("alice", balanceMap);
    // Expense 1: Alice paid 60, split alice=20, bob=20, carol=20. Alice is owed 40.
    // Expense 2: Bob paid 30, split alice=15, bob=15. Alice owes Bob 15.
    // Net: alice is owed 40, owes 15 = net +25
    expect(parseFloat(aliceBalance.net.toString())).toBeCloseTo(25, 1);
  });

  it("handles settlements correctly", () => {
    const expenses = [
      {
        payers: [{ userId: "alice", amount: toDecimal("100") }],
        splits: [
          { userId: "alice", amount: toDecimal("50") },
          { userId: "bob", amount: toDecimal("50") },
        ],
      },
    ];
    const settlements = [
      { fromId: "bob", toId: "alice", amount: toDecimal("50") },
    ];

    const balanceMap = calculateNetBalances(expenses, settlements);
    const bobBalance = getUserNetBalance("bob", balanceMap);
    expect(bobBalance.youOwe.toFixed(2)).toBe("0.00");
    expect(bobBalance.youAreOwed.toFixed(2)).toBe("0.00");
  });
});

describe("simplifyDebts", () => {
  it("simplifies a triangle of debts", () => {
    // A owes B 10, B owes C 10, A owes C 5
    const expenses = [
      {
        payers: [{ userId: "B", amount: toDecimal("20") }],
        splits: [
          { userId: "B", amount: toDecimal("10") },
          { userId: "A", amount: toDecimal("10") },
        ],
      },
      {
        payers: [{ userId: "C", amount: toDecimal("30") }],
        splits: [
          { userId: "C", amount: toDecimal("15") },
          { userId: "B", amount: toDecimal("10") },
          { userId: "A", amount: toDecimal("5") },
        ],
      },
    ];

    const balanceMap = calculateNetBalances(expenses, []);
    const simplified = simplifyDebts(balanceMap);

    // A owes 15 total, B net 0 (paid 20, owes 20), C is owed 15
    // Simplified: A pays C 15
    const totalTransferred = simplified.reduce(
      (sum, d) => sum.plus(d.amount),
      new Decimal(0)
    );
    expect(totalTransferred.toFixed(2)).toBe("15.00");
    expect(simplified.length).toBeLessThanOrEqual(2);
  });

  it("returns empty for balanced state", () => {
    const balanceMap = new Map<string, Map<string, Decimal>>();
    const simplified = simplifyDebts(balanceMap);
    expect(simplified).toHaveLength(0);
  });

  it("handles multi-party debt simplification", () => {
    // 4 people: A paid 100, split 4 ways equally (25 each)
    // B paid 40, split 4 ways (10 each)
    const expenses = [
      {
        payers: [{ userId: "A", amount: toDecimal("100") }],
        splits: [
          { userId: "A", amount: toDecimal("25") },
          { userId: "B", amount: toDecimal("25") },
          { userId: "C", amount: toDecimal("25") },
          { userId: "D", amount: toDecimal("25") },
        ],
      },
      {
        payers: [{ userId: "B", amount: toDecimal("40") }],
        splits: [
          { userId: "A", amount: toDecimal("10") },
          { userId: "B", amount: toDecimal("10") },
          { userId: "C", amount: toDecimal("10") },
          { userId: "D", amount: toDecimal("10") },
        ],
      },
    ];

    const balanceMap = calculateNetBalances(expenses, []);
    const simplified = simplifyDebts(balanceMap);

    // A is owed 100-25-10=65
    // B is owed 40-25-10=5
    // C owes 25+10=35
    // D owes 25+10=35
    // Total debt = 70
    // Simplified should minimize number of payments
    expect(simplified.length).toBeLessThanOrEqual(3);

    const totalTransferred = simplified.reduce(
      (sum, d) => sum.plus(d.amount),
      new Decimal(0)
    );
    expect(totalTransferred.toFixed(2)).toBe("70.00");
  });
});

describe("multi-payer expense", () => {
  it("handles expense paid by multiple people", () => {
    const expenses = [
      {
        payers: [
          { userId: "alice", amount: toDecimal("60") },
          { userId: "bob", amount: toDecimal("40") },
        ],
        splits: [
          { userId: "alice", amount: toDecimal("50") },
          { userId: "bob", amount: toDecimal("50") },
        ],
      },
    ];

    const balanceMap = calculateNetBalances(expenses, []);
    const aliceBalance = getUserNetBalance("alice", balanceMap);
    const bobBalance = getUserNetBalance("bob", balanceMap);

    // Alice paid 60, her share is 50. So alice is owed 10 from bob.
    // Bob paid 40, his share is 50. So bob owes 10 to alice.
    expect(aliceBalance.youAreOwed.toFixed(2)).toBe("10.00");
    expect(bobBalance.youOwe.toFixed(2)).toBe("10.00");
  });
});

describe("settlement integration", () => {
  it("partial settlement reduces balance", () => {
    const expenses = [
      {
        payers: [{ userId: "alice", amount: toDecimal("100") }],
        splits: [
          { userId: "alice", amount: toDecimal("50") },
          { userId: "bob", amount: toDecimal("50") },
        ],
      },
    ];
    const settlements = [
      { fromId: "bob", toId: "alice", amount: toDecimal("20") },
    ];

    const balanceMap = calculateNetBalances(expenses, settlements);
    const bobBalance = getUserNetBalance("bob", balanceMap);
    expect(bobBalance.youOwe.toFixed(2)).toBe("30.00");
  });

  it("overpayment settlement inverts balance", () => {
    const expenses = [
      {
        payers: [{ userId: "alice", amount: toDecimal("100") }],
        splits: [
          { userId: "alice", amount: toDecimal("50") },
          { userId: "bob", amount: toDecimal("50") },
        ],
      },
    ];
    const settlements = [
      { fromId: "bob", toId: "alice", amount: toDecimal("70") },
    ];

    const balanceMap = calculateNetBalances(expenses, settlements);
    const bobBalance = getUserNetBalance("bob", balanceMap);
    // Bob owed 50, paid 70, so alice now owes bob 20
    expect(bobBalance.youAreOwed.toFixed(2)).toBe("20.00");
  });
});

describe("edge cases", () => {
  it("handles zero amount", () => {
    const result = calculateEqualSplit(toDecimal("0"), ["a", "b"]);
    expect(result[0].amount.toString()).toBe("0");
    expect(result[1].amount.toString()).toBe("0");
  });

  it("handles very large amounts", () => {
    const result = calculateEqualSplit(toDecimal("999999999.99"), ["a", "b", "c"]);
    const total = result.reduce((sum, r) => sum.plus(r.amount), new Decimal(0));
    expect(total.toString()).toBe("999999999.99");
  });

  it("handles very small amounts", () => {
    const result = calculateEqualSplit(toDecimal("0.01"), ["a", "b"]);
    const total = result.reduce((sum, r) => sum.plus(r.amount), new Decimal(0));
    expect(total.toString()).toBe("0.01");
  });

  it("handles many participants", () => {
    const ids = Array.from({ length: 20 }, (_, i) => `user${i}`);
    const result = calculateEqualSplit(toDecimal("100"), ids);
    const total = result.reduce((sum, r) => sum.plus(r.amount), new Decimal(0));
    expect(total.toString()).toBe("100");
    expect(result).toHaveLength(20);
  });
});
