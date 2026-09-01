import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const groupId = searchParams.get("groupId");
  const category = searchParams.get("category");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const sortBy = searchParams.get("sortBy") || "date";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const where: Record<string, unknown> = {
    deletedAt: null,
    OR: [
      { paidById: session.user.id },
      { splits: { some: { userId: session.user.id } } },
      { group: { members: { some: { userId: session.user.id } } } },
    ],
  };

  if (q) {
    where.AND = [
      {
        OR: [
          { description: { contains: q, mode: "insensitive" } },
          { notes: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ],
      },
    ];
  }

  if (groupId) where.groupId = groupId;
  if (category) where.category = category;
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) (where.date as Record<string, unknown>).gte = new Date(dateFrom);
    if (dateTo) (where.date as Record<string, unknown>).lte = new Date(dateTo);
  }

  const orderBy: Record<string, string> = {};
  if (sortBy === "amount") orderBy.amount = sortOrder;
  else orderBy.date = sortOrder;

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      paidBy: { select: { id: true, name: true, email: true } },
      group: { select: { id: true, name: true } },
      splits: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy,
    take: 50,
  });

  return NextResponse.json(expenses);
}
