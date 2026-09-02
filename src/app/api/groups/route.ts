import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGroupSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groups = await prisma.group.findMany({
    where: {
      members: { some: { userId: session.user.id } },
      archived: false,
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
      _count: { select: { expenses: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { name, description, type, memberEmails } = parsed.data;
  const userId = session.user.id;
  const userName = session.user.name;

  const group = await prisma.$transaction(async (tx) => {
    const group = await tx.group.create({
      data: {
        name,
        description,
        type,
        createdById: userId,
        members: {
          create: { userId, role: "ADMIN" },
        },
      },
    });

    if (memberEmails?.length) {
      for (const email of memberEmails) {
        const user = await tx.user.findUnique({ where: { email } });
        if (user && user.id !== userId) {
          await tx.groupMember.create({
            data: { groupId: group.id, userId: user.id },
          });
          await tx.notification.create({
            data: {
              userId: user.id,
              type: "GROUP_ADDED",
              title: "Added to group",
              message: `${userName || "Someone"} added you to "${name}"`,
              link: `/groups/${group.id}`,
            },
          });
        }
      }
    }

    await tx.activity.create({
      data: {
        type: "GROUP_CREATED",
        description: `created group "${name}"`,
        userId,
        groupId: group.id,
      },
    });

    return group;
  });

  return NextResponse.json(group, { status: 201 });
}
