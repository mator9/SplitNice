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

  const expenseData = expenses.map((e) => ({
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

  const settlementData = settlements.map((s) => ({
    fromId: s.fromId,
    toId: s.toId,
    amount: toDecimal(s.amount.toString()),
  }));

  const balanceMap = calculateNetBalances(expenseData, settlementData);
  const myBalance = getUserNetBalance(session.user.id, balanceMap);
  const simplified = simplifyDebts(balanceMap);

  const relevantDebts = simplified.filter(
    (d) => d.from === session.user!.id || d.to === session.user!.id
  );

  const userIds = new Set<string>();
  relevantDebts.forEach((d) => {
    userIds.add(d.from);
    userIds.add(d.to);
  });

  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(userIds) } },
    select: { id: true, name: true, email: true, image: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return NextResponse.json({
    youOwe: myBalance.youOwe.toFixed(2),
    youAreOwed: myBalance.youAreOwed.toFixed(2),
    net: myBalance.net.toFixed(2),
    debts: relevantDebts.map((d) => ({
      from: userMap.get(d.from),
      to: userMap.get(d.to),
      amount: d.amount.toFixed(2),
    })),
  });
}
