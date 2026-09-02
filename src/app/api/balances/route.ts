import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  calculateNetBalances,
  simplifyDebts,
  getUserNetBalance,
  toDecimal,
} from "@/lib/money";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expenses = await prisma.expense.findMany({
    where: {
      deletedAt: null,
      OR: [
        { paidById: session.user.id },
        { splits: { some: { userId: session.user.id } } },
        { payers: { some: { userId: session.user.id } } },
      ],
    },
    include: { payers: true, splits: true },
  });

  const settlements = await prisma.settlement.findMany({
    where: {
      OR: [{ fromId: session.user.id }, { toId: session.user.id }],
    },
  });

  const expensesByCurrency = new Map<string, typeof expenses>();
  for (const e of expenses) {
    const cur = e.currency;
    if (!expensesByCurrency.has(cur)) expensesByCurrency.set(cur, []);
    expensesByCurrency.get(cur)!.push(e);
  }

  const settlementsByCurrency = new Map<string, typeof settlements>();
  for (const s of settlements) {
    const cur = s.currency;
    if (!settlementsByCurrency.has(cur)) settlementsByCurrency.set(cur, []);
    settlementsByCurrency.get(cur)!.push(s);
  }

  const allCurrencies = new Set([
    ...expensesByCurrency.keys(),
    ...settlementsByCurrency.keys(),
  ]);

  const userIds = new Set<string>();

  const balanceByCurrency: Array<{
    currency: string;
    youOwe: string;
    youAreOwed: string;
    net: string;
  }> = [];

  const allDebts: Array<{
    from: string;
    to: string;
    amount: string;
    currency: string;
  }> = [];

  for (const currency of allCurrencies) {
    const curExpenses = (expensesByCurrency.get(currency) || []).map((e) => ({
      payers:
        e.payers.length > 0
          ? e.payers.map((p) => ({
              userId: p.userId,
              amount: toDecimal(p.amount.toString()),
            }))
          : [{ userId: e.paidById, amount: toDecimal(e.amount.toString()) }],
      splits: e.splits.map((s) => ({
        userId: s.userId,
        amount: toDecimal(s.amount.toString()),
      })),
    }));

    const curSettlements = (settlementsByCurrency.get(currency) || []).map(
      (s) => ({
        fromId: s.fromId,
        toId: s.toId,
        amount: toDecimal(s.amount.toString()),
      })
    );

    const balanceMap = calculateNetBalances(curExpenses, curSettlements);
    const myBalance = getUserNetBalance(session.user.id, balanceMap);
    const simplified = simplifyDebts(balanceMap);

    balanceByCurrency.push({
      currency,
      youOwe: myBalance.youOwe.toFixed(2),
      youAreOwed: myBalance.youAreOwed.toFixed(2),
      net: myBalance.net.toFixed(2),
    });

    const relevantDebts = simplified.filter(
      (d) => d.from === session.user!.id || d.to === session.user!.id
    );

    for (const d of relevantDebts) {
      userIds.add(d.from);
      userIds.add(d.to);
      allDebts.push({
        from: d.from,
        to: d.to,
        amount: d.amount.toFixed(2),
        currency,
      });
    }
  }

  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(userIds) } },
    select: { id: true, name: true, email: true, image: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return NextResponse.json({
    balanceByCurrency,
    debts: allDebts.map((d) => ({
      from: userMap.get(d.from),
      to: userMap.get(d.to),
      amount: d.amount,
      currency: d.currency,
    })),
  });
}
