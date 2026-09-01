import { prisma } from "./prisma";

export async function isGroupMember(
  userId: string,
  groupId: string
): Promise<boolean> {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return !!membership;
}

export async function isGroupAdmin(
  userId: string,
  groupId: string
): Promise<boolean> {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return membership?.role === "ADMIN";
}

export async function canAccessExpense(
  userId: string,
  expenseId: string
): Promise<boolean> {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      splits: true,
      payers: true,
      group: { include: { members: true } },
    },
  });

  if (!expense) return false;

  if (expense.paidById === userId) return true;
  if (expense.splits.some((s) => s.userId === userId)) return true;
  if (expense.payers.some((p) => p.userId === userId)) return true;
  if (expense.group?.members.some((m) => m.userId === userId)) return true;

  return false;
}

export async function areFriends(
  userId: string,
  otherUserId: string
): Promise<boolean> {
  if (userId === otherUserId) return true;

  const relation = await prisma.friendRelation.findFirst({
    where: {
      OR: [
        { userId, friendId: otherUserId, status: "ACCEPTED" },
        { userId: otherUserId, friendId: userId, status: "ACCEPTED" },
      ],
    },
  });
  return !!relation;
}
