import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ friendRelationId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { friendRelationId } = await params;

  const relation = await prisma.friendRelation.findUnique({
    where: { id: friendRelationId },
  });

  if (!relation || relation.friendId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updated = await tx.friendRelation.update({
      where: { id: friendRelationId },
      data: { status: parsed.data.status },
    });

    if (parsed.data.status === "ACCEPTED") {
      const currentUserName = session.user?.name;
      await tx.notification.create({
        data: {
          userId: relation.userId,
          type: "FRIEND_ACCEPTED",
          title: "Friend request accepted",
          message: `${currentUserName || "Someone"} accepted your friend request`,
          link: "/friends",
        },
      });
      await tx.activity.create({
        data: {
          type: "FRIEND_ADDED",
          description: `became friends with ${currentUserName || "someone"}`,
          userId: relation.userId,
        },
      });
    }

    return updated;
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ friendRelationId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { friendRelationId } = await params;

  const relation = await prisma.friendRelation.findUnique({
    where: { id: friendRelationId },
  });

  if (
    !relation ||
    (relation.userId !== session.user.id && relation.friendId !== session.user.id)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.friendRelation.delete({ where: { id: friendRelationId } });

  return NextResponse.json({ success: true });
}
