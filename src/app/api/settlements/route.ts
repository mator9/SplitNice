import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSettlementSchema } from "@/lib/validations";
import { toDecimal, formatMoney } from "@/lib/money";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");

  const where: Record<string, unknown> = {
    OR: [{ fromId: session.user.id }, { toId: session.user.id }],
  };
  if (groupId) where.groupId = groupId;

  const settlements = await prisma.settlement.findMany({
    where,
    include: {
      from: { select: { id: true, name: true, email: true, image: true } },
      to: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(settlements);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSettlementSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const data = parsed.data;

  if (data.fromId !== session.user.id && data.toId !== session.user.id) {
    return NextResponse.json(
      { error: "You must be part of this settlement" },
      { status: 403 }
    );
  }

  const amount = toDecimal(data.amount);
  const currentUserId = session.user.id;
  const currentUserName = session.user.name;

  const settlement = await prisma.$transaction(async (tx) => {
    const settlement = await tx.settlement.create({
      data: {
        amount: amount.toFixed(4),
        currency: data.currency,
        fromId: data.fromId,
        toId: data.toId,
        groupId: data.groupId || null,
        notes: data.notes,
        date: data.date ? new Date(data.date) : new Date(),
      },
    });

    await tx.activity.create({
      data: {
        type: "SETTLEMENT_CREATED",
        description: `recorded a ${formatMoney(amount, data.currency)} payment`,
        userId: currentUserId,
        groupId: data.groupId || null,
        settlementId: settlement.id,
      },
    });

    const otherUserId =
      data.fromId === currentUserId ? data.toId : data.fromId;
    await tx.notification.create({
      data: {
        userId: otherUserId,
        type: "SETTLEMENT_RECORDED",
        title: "Settlement recorded",
        message: `${currentUserName || "Someone"} recorded a ${formatMoney(amount, data.currency)} payment`,
        link: "/activity",
      },
    });

    return settlement;
  });

  return NextResponse.json(settlement, { status: 201 });
}
