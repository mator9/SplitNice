import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addFriendSchema = z.object({
  email: z.string().email(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const relations = await prisma.friendRelation.findMany({
    where: {
      OR: [
        { userId: session.user.id, status: "ACCEPTED" },
        { friendId: session.user.id, status: "ACCEPTED" },
      ],
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      friend: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  const currentUserId = session.user.id;
  const friends = relations.map((r) =>
    r.userId === currentUserId ? r.friend : r.user
  );

  const pendingReceived = await prisma.friendRelation.findMany({
    where: { friendId: session.user.id, status: "PENDING" },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  const pendingSent = await prisma.friendRelation.findMany({
    where: { userId: session.user.id, status: "PENDING" },
    include: {
      friend: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return NextResponse.json({
    friends,
    pendingReceived: pendingReceived.map((r) => ({
      id: r.id,
      user: r.user,
    })),
    pendingSent: pendingSent.map((r) => ({
      id: r.id,
      user: r.friend,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = addFriendSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const friend = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!friend) {
    return NextResponse.json(
      { error: "User not found. They need to sign up first." },
      { status: 404 }
    );
  }

  if (friend.id === session.user.id) {
    return NextResponse.json(
      { error: "Cannot add yourself" },
      { status: 400 }
    );
  }

  const existing = await prisma.friendRelation.findFirst({
    where: {
      OR: [
        { userId: session.user.id, friendId: friend.id },
        { userId: friend.id, friendId: session.user.id },
      ],
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Friend request already exists" },
      { status: 409 }
    );
  }

  const currentUserId = session.user.id;
  const currentUserName = session.user.name || session.user.email;

  const relation = await prisma.$transaction(async (tx) => {
    const relation = await tx.friendRelation.create({
      data: { userId: currentUserId, friendId: friend.id },
    });

    await tx.notification.create({
      data: {
        userId: friend.id,
        type: "FRIEND_REQUEST",
        title: "Friend request",
        message: `${currentUserName} sent you a friend request`,
        link: "/friends",
      },
    });

    return relation;
  });

  return NextResponse.json(relation, { status: 201 });
}
