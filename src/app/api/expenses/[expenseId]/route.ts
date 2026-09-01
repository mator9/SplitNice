import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessExpense } from "@/lib/authz";
import { createExpenseSchema } from "@/lib/validations";
import { calculateSplit, toDecimal, Decimal } from "@/lib/money";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { expenseId } = await params;

  if (!(await canAccessExpense(session.user.id, expenseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      paidBy: { select: { id: true, name: true, email: true, image: true } },
      splits: { include: { user: { select: { id: true, name: true, email: true } } } },
      payers: { include: { user: { select: { id: true, name: true, email: true } } } },
      group: { select: { id: true, name: true } },
      attachments: true,
    },
  });

  if (!expense || expense.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(expense);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { expenseId } = await params;

  if (!(await canAccessExpense(session.user.id, expenseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const totalAmount = toDecimal(data.amount);
  const splitResults = calculateSplit(data.splitType, totalAmount, data.splits);
  const currentUserId = session.user.id;

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

  const expense = await prisma.$transaction(async (tx) => {
    await tx.expenseSplit.deleteMany({ where: { expenseId } });
    await tx.expensePayer.deleteMany({ where: { expenseId } });

    const expense = await tx.expense.update({
      where: { id: expenseId },
      data: {
        description: data.description,
        amount: totalAmount.toFixed(4),
        currency: data.currency,
        date: data.date ? new Date(data.date) : undefined,
        category: data.category,
        notes: data.notes,
        splitType: data.splitType,
        paidById: data.paidById,
      },
    });

    if (data.payers && data.payers.length > 0) {
      for (const payer of data.payers) {
        await tx.expensePayer.create({
          data: {
            expenseId,
            userId: payer.userId,
            amount: toDecimal(payer.amount).toFixed(4),
          },
        });
      }
    } else {
      await tx.expensePayer.create({
        data: {
          expenseId,
          userId: data.paidById,
          amount: totalAmount.toFixed(4),
        },
      });
    }

    for (const split of splitResults) {
      await tx.expenseSplit.create({
        data: {
          expenseId,
          userId: split.userId,
          amount: split.amount.toFixed(4),
          percentage: split.percentage?.toFixed(4),
          shares: split.shares,
        },
      });
    }

    await tx.activity.create({
      data: {
        type: "EXPENSE_EDITED",
        description: `edited "${data.description}"`,
        userId: currentUserId,
        groupId: expense.groupId,
        expenseId,
      },
    });

    return expense;
  });

  return NextResponse.json(expense);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { expenseId } = await params;

  if (!(await canAccessExpense(session.user.id, expenseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const expense = await prisma.expense.update({
    where: { id: expenseId },
    data: { deletedAt: new Date() },
  });

  await prisma.activity.create({
    data: {
      type: "EXPENSE_DELETED",
      description: `deleted expense "${expense.description}"`,
      userId: session.user.id,
      groupId: expense.groupId,
      expenseId,
    },
  });

  return NextResponse.json({ success: true });
}
