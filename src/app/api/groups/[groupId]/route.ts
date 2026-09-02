import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGroupMember, isGroupAdmin } from "@/lib/authz";
import { updateGroupSchema } from "@/lib/validations";

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

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      expenses: {
        where: { deletedAt: null },
        include: {
          paidBy: { select: { id: true, name: true, email: true, image: true } },
          splits: { include: { user: { select: { id: true, name: true } } } },
          payers: { include: { user: { select: { id: true, name: true } } } },
        },
        orderBy: { date: "desc" },
        take: 50,
      },
    },
  });

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  return NextResponse.json(group);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;

  if (!(await isGroupAdmin(session.user.id, groupId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateGroupSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const group = await prisma.group.update({
    where: { id: groupId },
    data: parsed.data,
  });

  await prisma.activity.create({
    data: {
      type: "GROUP_EDITED",
      description: `updated group "${group.name}"`,
      userId: session.user.id,
      groupId,
    },
  });

  return NextResponse.json(group);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;

  if (!(await isGroupAdmin(session.user.id, groupId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.group.update({
    where: { id: groupId },
    data: { archived: true },
  });

  return NextResponse.json({ success: true });
}
