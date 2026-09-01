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
  const simplifiedDebts = simplifyDebts(balanceMap);
  const myBalance = getUserNetBalance(session.user.id, balanceMap);

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });

  const memberBalances = members.map((m) => {
    const bal = getUserNetBalance(m.userId, balanceMap);
    return {
      user: m.user,
      youOwe: bal.youOwe.toFixed(2),
      youAreOwed: bal.youAreOwed.toFixed(2),
      net: bal.net.toFixed(2),
    };
  });

  return NextResponse.json({
    myBalance: {
      youOwe: myBalance.youOwe.toFixed(2),
      youAreOwed: myBalance.youAreOwed.toFixed(2),
      net: myBalance.net.toFixed(2),
    },
    simplifiedDebts: simplifiedDebts.map((d) => ({
      from: d.from,
      to: d.to,
      amount: d.amount.toFixed(2),
    })),
    memberBalances,
  });
}
