import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userGroups = await prisma.groupMember.findMany({
    where: { userId: session.user.id },
    select: { groupId: true },
  });
  const groupIds = userGroups.map((g) => g.groupId);

  const activities = await prisma.activity.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { groupId: { in: groupIds } },
      ],
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      group: { select: { id: true, name: true } },
      expense: { select: { id: true, description: true, amount: true } },
      settlement: { select: { id: true, amount: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(activities);
}
