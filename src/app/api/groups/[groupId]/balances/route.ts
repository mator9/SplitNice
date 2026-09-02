import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGroupMember } from "@/lib/authz";
import {
  calculateNetBalances,
  simplifyDebts,
  getUserNetBalance,
  toDecimal,
} from "@/lib/money";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;

  if (!(await isGroupMember(session.user.id, groupId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const expenses = await prisma.expense.findMany({
    where: { groupId, deletedAt: null },
    include: { payers: true, splits: true },
  });

  const settlements = await prisma.settlement.findMany({
    where: { groupId },
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

  const balanceByCurrency: Array<{
    currency: string;
    youOwe: string;
    youAreOwed: string;
    net: string;
  }> = [];

  const allSimplifiedDebts: Array<{
    from: string;
    to: string;
    amount: string;
    currency: string;
  }> = [];

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  const memberBalancesByCurrency: Array<{
    currency: string;
    balances: Array<{
      user: { id: string; name: string | null; email: string; image: string | null };
      youOwe: string;
      youAreOwed: string;
      net: string;
    }>;
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

    for (const d of simplified) {
      allSimplifiedDebts.push({
        from: d.from,
        to: d.to,
        amount: d.amount.toFixed(2),
        currency,
      });
    }

    memberBalancesByCurrency.push({
      currency,
      balances: members.map((m) => {
        const bal = getUserNetBalance(m.userId, balanceMap);
        return {
          user: m.user,
          youOwe: bal.youOwe.toFixed(2),
          youAreOwed: bal.youAreOwed.toFixed(2),
          net: bal.net.toFixed(2),
        };
      }),
    });
  }

  return NextResponse.json({
    balanceByCurrency,
    simplifiedDebts: allSimplifiedDebts,
    memberBalancesByCurrency,
  });
}
