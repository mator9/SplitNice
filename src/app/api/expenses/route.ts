import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createExpenseSchema } from "@/lib/validations";
import { calculateSplit, toDecimal, Decimal } from "@/lib/money";
import { isGroupMember } from "@/lib/authz";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const where: Record<string, unknown> = {
    deletedAt: null,
    OR: [
      { paidById: session.user.id },
      { splits: { some: { userId: session.user.id } } },
      { payers: { some: { userId: session.user.id } } },
      {
        group: { members: { some: { userId: session.user.id } } },
      },
    ],
  };

  if (groupId) {
    where.groupId = groupId;
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      paidBy: { select: { id: true, name: true, email: true, image: true } },
      splits: { include: { user: { select: { id: true, name: true, email: true } } } },
      payers: { include: { user: { select: { id: true, name: true, email: true } } } },
      group: { select: { id: true, name: true } },
      attachments: true,
    },
    orderBy: { date: "desc" },
    take: limit,
    skip: offset,
  });

  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  if (data.groupId) {
    if (!(await isGroupMember(session.user.id, data.groupId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const totalAmount = toDecimal(data.amount);

  const splitResults = calculateSplit(
    data.splitType,
    totalAmount,
    data.splits
  );

  const splitSum = splitResults.reduce(
    (sum, s) => sum.plus(s.amount),
    new Decimal(0)
  );
  if (!splitSum.equals(totalAmount)) {
    return NextResponse.json(
      { error: "Split amounts don't match total" },
      { status: 400 }
    );
  }

  const currentUserId = session.user.id;
  const currentUserName = session.user.name;

  const expense = await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        description: data.description,
        amount: totalAmount.toFixed(4),
        currency: data.currency,
        date: data.date ? new Date(data.date) : new Date(),
        category: data.category,
        notes: data.notes,
        splitType: data.splitType,
        groupId: data.groupId || null,
        paidById: data.paidById,
      },
    });

    if (data.payers && data.payers.length > 0) {
      for (const payer of data.payers) {
        await tx.expensePayer.create({
          data: {
            expenseId: expense.id,
            userId: payer.userId,
            amount: toDecimal(payer.amount).toFixed(4),
          },
        });
      }
    } else {
      await tx.expensePayer.create({
        data: {
          expenseId: expense.id,
          userId: data.paidById,
          amount: totalAmount.toFixed(4),
        },
      });
    }

    for (const split of splitResults) {
      await tx.expenseSplit.create({
        data: {
          expenseId: expense.id,
          userId: split.userId,
          amount: split.amount.toFixed(4),
          percentage: split.percentage?.toFixed(4),
          shares: split.shares,
        },
      });
    }

    await tx.activity.create({
      data: {
        type: "EXPENSE_CREATED",
        description: `added "${data.description}" ($${totalAmount.toFixed(2)})`,
        userId: currentUserId,
        groupId: data.groupId || null,
        expenseId: expense.id,
      },
    });

    const participants = new Set(splitResults.map((s) => s.userId));
    if (data.payers) {
      data.payers.forEach((p) => participants.add(p.userId));
    }
    participants.delete(currentUserId);

    for (const participantId of participants) {
      await tx.notification.create({
        data: {
          userId: participantId,
          type: "EXPENSE_ADDED",
          title: "New expense",
          message: `${currentUserName || "Someone"} added "${data.description}"`,
          link: data.groupId
            ? `/groups/${data.groupId}`
            : "/dashboard",
        },
      });
    }

    return expense;
  });

  return NextResponse.json(expense, { status: 201 });
}
