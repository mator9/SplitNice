import Decimal from "decimal.js";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export { Decimal };

export function toDecimal(value: string | number | Decimal): Decimal {
  return new Decimal(value);
}

export function formatMoney(
  amount: Decimal | string | number,
  currency = "USD"
): string {
  const d = toDecimal(amount);
  const abs = d.abs();
  const sign = d.isNegative() ? "-" : "";
  const sym = currencySymbol(currency);
  return `${sign}${sym}${abs.toFixed(2)}`;
}

export function currencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    JPY: "¥",
    CAD: "C$",
    AUD: "A$",
  };
  return symbols[currency] || `${currency} `;
}

export interface SplitInput {
  userId: string;
  amount?: string;
  percentage?: string;
  shares?: number;
}

export interface SplitResult {
  userId: string;
  amount: Decimal;
  percentage?: Decimal;
  shares?: number;
}

export function calculateEqualSplit(
  totalAmount: Decimal,
  participantIds: string[]
): SplitResult[] {
  const count = participantIds.length;
  if (count === 0) throw new Error("Must have at least one participant");

  const perPerson = totalAmount.div(count).toDecimalPlaces(2, Decimal.ROUND_DOWN);
  let remainder = totalAmount.minus(perPerson.times(count));

  return participantIds.map((userId) => {
    let amount = perPerson;
    if (remainder.greaterThan(0)) {
      amount = amount.plus(new Decimal("0.01"));
      remainder = remainder.minus(new Decimal("0.01"));
    }
    return { userId, amount };
  });
}

export function calculateExactSplit(
  totalAmount: Decimal,
  inputs: SplitInput[]
): SplitResult[] {
  const results: SplitResult[] = inputs.map((input) => ({
    userId: input.userId,
    amount: toDecimal(input.amount || "0"),
  }));

  const sum = results.reduce((acc, r) => acc.plus(r.amount), new Decimal(0));
  if (!sum.equals(totalAmount)) {
    throw new Error(
      `Exact split amounts (${sum.toFixed(2)}) don't equal total (${totalAmount.toFixed(2)})`
    );
  }

  return results;
}

export function calculatePercentageSplit(
  totalAmount: Decimal,
  inputs: SplitInput[]
): SplitResult[] {
  const totalPct = inputs.reduce(
    (acc, i) => acc.plus(toDecimal(i.percentage || "0")),
    new Decimal(0)
  );

  if (!totalPct.equals(new Decimal("100"))) {
    throw new Error(`Percentages must sum to 100, got ${totalPct.toFixed(2)}`);
  }

  const results: SplitResult[] = inputs.map((input) => {
    const pct = toDecimal(input.percentage || "0");
    return {
      userId: input.userId,
      amount: totalAmount.times(pct).div(100).toDecimalPlaces(2, Decimal.ROUND_DOWN),
      percentage: pct,
    };
  });

  const sum = results.reduce((acc, r) => acc.plus(r.amount), new Decimal(0));
  let remainder = totalAmount.minus(sum);
  let idx = 0;
  while (remainder.greaterThan(0)) {
    results[idx % results.length].amount = results[idx % results.length].amount.plus(
      new Decimal("0.01")
    );
    remainder = remainder.minus(new Decimal("0.01"));
    idx++;
  }

  return results;
}

export function calculateSharesSplit(
  totalAmount: Decimal,
  inputs: SplitInput[]
): SplitResult[] {
  const totalShares = inputs.reduce((acc, i) => acc + (i.shares || 1), 0);
  if (totalShares === 0) throw new Error("Total shares must be greater than 0");

  const results: SplitResult[] = inputs.map((input) => {
    const shares = input.shares || 1;
    return {
      userId: input.userId,
      amount: totalAmount
        .times(shares)
        .div(totalShares)
        .toDecimalPlaces(2, Decimal.ROUND_DOWN),
      shares,
    };
  });

  const sum = results.reduce((acc, r) => acc.plus(r.amount), new Decimal(0));
  let remainder = totalAmount.minus(sum);
  let idx = 0;
  while (remainder.greaterThan(0)) {
    results[idx % results.length].amount = results[idx % results.length].amount.plus(
      new Decimal("0.01")
    );
    remainder = remainder.minus(new Decimal("0.01"));
    idx++;
  }

  return results;
}

export function calculateSplit(
  splitType: "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES",
  totalAmount: Decimal,
  inputs: SplitInput[]
): SplitResult[] {
  switch (splitType) {
    case "EQUAL":
      return calculateEqualSplit(
        totalAmount,
        inputs.map((i) => i.userId)
      );
    case "EXACT":
      return calculateExactSplit(totalAmount, inputs);
    case "PERCENTAGE":
      return calculatePercentageSplit(totalAmount, inputs);
    case "SHARES":
      return calculateSharesSplit(totalAmount, inputs);
    default:
      throw new Error(`Unknown split type: ${splitType}`);
  }
}

export interface BalanceEntry {
  userId: string;
  amount: Decimal;
}

export interface DebtEdge {
  from: string;
  to: string;
  amount: Decimal;
}

export function calculateNetBalances(
  expenses: Array<{
    payers: Array<{ userId: string; amount: Decimal | string }>;
    splits: Array<{ userId: string; amount: Decimal | string }>;
  }>,
  settlements: Array<{
    fromId: string;
    toId: string;
    amount: Decimal | string;
  }>
): Map<string, Map<string, Decimal>> {
  const balances = new Map<string, Map<string, Decimal>>();

  function addBalance(from: string, to: string, amount: Decimal) {
    if (from === to) return;
    if (!balances.has(from)) balances.set(from, new Map());
    if (!balances.has(to)) balances.set(to, new Map());

    const current = balances.get(from)!.get(to) || new Decimal(0);
    balances.get(from)!.set(to, current.plus(amount));

    const reverse = balances.get(to)!.get(from) || new Decimal(0);
    balances.get(to)!.set(from, reverse.minus(amount));
  }

  for (const expense of expenses) {
    for (const split of expense.splits) {
      const owedAmount = toDecimal(split.amount);
      for (const payer of expense.payers) {
        const payerAmount = toDecimal(payer.amount);
        const totalPaid = expense.payers.reduce(
          (sum, p) => sum.plus(toDecimal(p.amount)),
          new Decimal(0)
        );
        const payerShare = payerAmount.div(totalPaid);
        const portionOwed = owedAmount.times(payerShare).toDecimalPlaces(4);
        addBalance(split.userId, payer.userId, portionOwed);
      }
    }
  }

  for (const settlement of settlements) {
    const amount = toDecimal(settlement.amount);
    const fromDebt =
      balances.get(settlement.fromId)?.get(settlement.toId) || new Decimal(0);

    if (fromDebt.greaterThanOrEqualTo(0)) {
      addBalance(settlement.fromId, settlement.toId, amount.neg());
    } else {
      addBalance(settlement.toId, settlement.fromId, amount.neg());
    }
  }

  return balances;
}

export function simplifyDebts(
  balanceMap: Map<string, Map<string, Decimal>>
): DebtEdge[] {
  const netBalance = new Map<string, Decimal>();

  for (const [user, debts] of balanceMap) {
    for (const [, amount] of debts) {
      if (!netBalance.has(user)) netBalance.set(user, new Decimal(0));
      netBalance.set(user, netBalance.get(user)!.minus(amount));
    }
  }

  const debtors: Array<{ userId: string; amount: Decimal }> = [];
  const creditors: Array<{ userId: string; amount: Decimal }> = [];

  for (const [userId, balance] of netBalance) {
    const rounded = balance.toDecimalPlaces(2);
    if (rounded.greaterThan(0)) {
      creditors.push({ userId, amount: rounded });
    } else if (rounded.lessThan(0)) {
      debtors.push({ userId, amount: rounded.abs() });
    }
  }

  debtors.sort((a, b) => b.amount.comparedTo(a.amount));
  creditors.sort((a, b) => b.amount.comparedTo(a.amount));

  const result: DebtEdge[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const settleAmount = Decimal.min(debtor.amount, creditor.amount);

    if (settleAmount.greaterThan(new Decimal("0.00"))) {
      result.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: settleAmount.toDecimalPlaces(2),
      });
    }

    debtor.amount = debtor.amount.minus(settleAmount);
    creditor.amount = creditor.amount.minus(settleAmount);

    if (debtor.amount.lessThanOrEqualTo(new Decimal("0.005"))) i++;
    if (creditor.amount.lessThanOrEqualTo(new Decimal("0.005"))) j++;
  }

  return result;
}

export function getUserNetBalance(
  userId: string,
  balanceMap: Map<string, Map<string, Decimal>>
): { youOwe: Decimal; youAreOwed: Decimal; net: Decimal } {
  let youOwe = new Decimal(0);
  let youAreOwed = new Decimal(0);

  const userDebts = balanceMap.get(userId);
  if (userDebts) {
    for (const [, amount] of userDebts) {
      const rounded = amount.toDecimalPlaces(2);
      if (rounded.greaterThan(0)) {
        youOwe = youOwe.plus(rounded);
      } else if (rounded.lessThan(0)) {
        youAreOwed = youAreOwed.plus(rounded.abs());
      }
    }
  }

  return { youOwe, youAreOwed, net: youAreOwed.minus(youOwe) };
}
