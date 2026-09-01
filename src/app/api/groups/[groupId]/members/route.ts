import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGroupMember, isGroupAdmin } from "@/lib/authz";
import { z } from "zod";

const addMemberSchema = z.object({
  email: z.string().email(),
});

export async function POST(
  req: NextRequest,
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

  const body = await req.json();
  const parsed = addMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found. They need to sign up first." },
      { status: 404 }
    );
  }

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: user.id } },
  });

  if (existing) {
    return NextResponse.json(
      { error: "User is already a member" },
      { status: 409 }
    );
  }

  const group = await prisma.group.findUnique({ where: { id: groupId } });

  await prisma.$transaction([
    prisma.groupMember.create({
      data: { groupId, userId: user.id },
    }),
    prisma.notification.create({
      data: {
        userId: user.id,
        type: "GROUP_ADDED",
        title: "Added to group",
        message: `${session.user.name || "Someone"} added you to "${group?.name}"`,
        link: `/groups/${groupId}`,
      },
    }),
    prisma.activity.create({
      data: {
        type: "MEMBER_ADDED",
        description: `added ${user.name || user.email} to the group`,
        userId: session.user.id,
        groupId,
      },
    }),
  ]);

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;
  const { searchParams } = new URL(req.url);
  const memberUserId = searchParams.get("userId");

  if (!memberUserId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const isAdmin = await isGroupAdmin(session.user.id, groupId);
  const isSelf = memberUserId === session.user.id;

  if (!isAdmin && !isSelf) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId: memberUserId } },
  });

  const removedUser = await prisma.user.findUnique({
    where: { id: memberUserId },
  });

  await prisma.activity.create({
    data: {
      type: "MEMBER_REMOVED",
      description: `removed ${removedUser?.name || "a member"} from the group`,
      userId: session.user.id,
      groupId,
    },
  });

  return NextResponse.json({ success: true });
}
