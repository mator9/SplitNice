import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      name: "Alice Johnson",
      image: null,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      name: "Bob Smith",
      image: null,
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: "carol@example.com" },
    update: {},
    create: {
      email: "carol@example.com",
      name: "Carol Williams",
      image: null,
    },
  });

  const dave = await prisma.user.upsert({
    where: { email: "dave@example.com" },
    update: {},
    create: {
      email: "dave@example.com",
      name: "Dave Brown",
      image: null,
    },
  });

  console.log("Created users:", alice.name, bob.name, carol.name, dave.name);

  await prisma.friendRelation.upsert({
    where: { userId_friendId: { userId: alice.id, friendId: bob.id } },
    update: {},
    create: { userId: alice.id, friendId: bob.id, status: "ACCEPTED" },
  });
  await prisma.friendRelation.upsert({
    where: { userId_friendId: { userId: alice.id, friendId: carol.id } },
    update: {},
    create: { userId: alice.id, friendId: carol.id, status: "ACCEPTED" },
  });
  await prisma.friendRelation.upsert({
    where: { userId_friendId: { userId: bob.id, friendId: carol.id } },
    update: {},
    create: { userId: bob.id, friendId: carol.id, status: "ACCEPTED" },
  });

  console.log("Created friend relations");

  const tripGroup = await prisma.group.create({
    data: {
      name: "Summer Road Trip 2026",
      description: "West coast road trip with the crew",
      type: "TRIP",
      createdById: alice.id,
      members: {
        create: [
          { userId: alice.id, role: "ADMIN" },
          { userId: bob.id, role: "MEMBER" },
          { userId: carol.id, role: "MEMBER" },
        ],
      },
    },
  });

  const aptGroup = await prisma.group.create({
    data: {
      name: "Apartment 4B",
      description: "Monthly shared expenses",
      type: "APARTMENT",
      createdById: bob.id,
      members: {
        create: [
          { userId: bob.id, role: "ADMIN" },
          { userId: alice.id, role: "MEMBER" },
          { userId: dave.id, role: "MEMBER" },
        ],
      },
    },
  });

  console.log("Created groups:", tripGroup.name, aptGroup.name);

  const expense1 = await prisma.expense.create({
    data: {
      description: "Gas station fill-up",
      amount: "75.00",
      currency: "USD",
      date: new Date("2026-07-15"),
      category: "Transport",
      splitType: "EQUAL",
      groupId: tripGroup.id,
      paidById: alice.id,
      payers: { create: { userId: alice.id, amount: "75.0000" } },
      splits: {
        create: [
          { userId: alice.id, amount: "25.0000" },
          { userId: bob.id, amount: "25.0000" },
          { userId: carol.id, amount: "25.0000" },
        ],
      },
    },
  });

  const expense2 = await prisma.expense.create({
    data: {
      description: "Dinner at Seaside Grill",
      amount: "120.00",
      currency: "USD",
      date: new Date("2026-07-16"),
      category: "Food",
      splitType: "EQUAL",
      groupId: tripGroup.id,
      paidById: bob.id,
      payers: { create: { userId: bob.id, amount: "120.0000" } },
      splits: {
        create: [
          { userId: alice.id, amount: "40.0000" },
          { userId: bob.id, amount: "40.0000" },
          { userId: carol.id, amount: "40.0000" },
        ],
      },
    },
  });

  const expense3 = await prisma.expense.create({
    data: {
      description: "Hotel - 2 nights",
      amount: "300.00",
      currency: "USD",
      date: new Date("2026-07-16"),
      category: "Accommodation",
      splitType: "SHARES",
      groupId: tripGroup.id,
      paidById: carol.id,
      payers: { create: { userId: carol.id, amount: "300.0000" } },
      splits: {
        create: [
          { userId: alice.id, amount: "100.0000", shares: 1 },
          { userId: bob.id, amount: "100.0000", shares: 1 },
          { userId: carol.id, amount: "100.0000", shares: 1 },
        ],
      },
    },
  });

  await prisma.expense.create({
    data: {
      description: "Monthly internet bill",
      amount: "90.00",
      currency: "USD",
      date: new Date("2026-08-01"),
      category: "Utilities",
      splitType: "EQUAL",
      groupId: aptGroup.id,
      paidById: bob.id,
      payers: { create: { userId: bob.id, amount: "90.0000" } },
      splits: {
        create: [
          { userId: bob.id, amount: "30.0000" },
          { userId: alice.id, amount: "30.0000" },
          { userId: dave.id, amount: "30.0000" },
        ],
      },
    },
  });

  await prisma.expense.create({
    data: {
      description: "Groceries",
      amount: "65.50",
      currency: "USD",
      date: new Date("2026-08-03"),
      category: "Food",
      splitType: "EXACT",
      groupId: aptGroup.id,
      paidById: alice.id,
      payers: { create: { userId: alice.id, amount: "65.5000" } },
      splits: {
        create: [
          { userId: alice.id, amount: "25.5000" },
          { userId: bob.id, amount: "20.0000" },
          { userId: dave.id, amount: "20.0000" },
        ],
      },
    },
  });

  console.log("Created expenses");

  await prisma.settlement.create({
    data: {
      amount: "25.00",
      currency: "USD",
      fromId: bob.id,
      toId: alice.id,
      groupId: tripGroup.id,
      notes: "For the gas",
      date: new Date("2026-07-17"),
    },
  });

  console.log("Created settlement");

  await prisma.activity.createMany({
    data: [
      {
        type: "GROUP_CREATED",
        description: 'created group "Summer Road Trip 2026"',
        userId: alice.id,
        groupId: tripGroup.id,
      },
      {
        type: "EXPENSE_CREATED",
        description: 'added "Gas station fill-up" ($75.00)',
        userId: alice.id,
        groupId: tripGroup.id,
        expenseId: expense1.id,
      },
      {
        type: "EXPENSE_CREATED",
        description: 'added "Dinner at Seaside Grill" ($120.00)',
        userId: bob.id,
        groupId: tripGroup.id,
        expenseId: expense2.id,
      },
      {
        type: "EXPENSE_CREATED",
        description: 'added "Hotel - 2 nights" ($300.00)',
        userId: carol.id,
        groupId: tripGroup.id,
        expenseId: expense3.id,
      },
      {
        type: "GROUP_CREATED",
        description: 'created group "Apartment 4B"',
        userId: bob.id,
        groupId: aptGroup.id,
      },
    ],
  });

  console.log("Created activities");

  await prisma.notification.createMany({
    data: [
      {
        userId: bob.id,
        type: "GROUP_ADDED",
        title: "Added to group",
        message: 'Alice added you to "Summer Road Trip 2026"',
        link: `/groups/${tripGroup.id}`,
      },
      {
        userId: carol.id,
        type: "GROUP_ADDED",
        title: "Added to group",
        message: 'Alice added you to "Summer Road Trip 2026"',
        link: `/groups/${tripGroup.id}`,
      },
      {
        userId: alice.id,
        type: "EXPENSE_ADDED",
        title: "New expense",
        message: 'Bob added "Dinner at Seaside Grill"',
        link: `/groups/${tripGroup.id}`,
      },
    ],
  });

  console.log("Created notifications");
  console.log("Seed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
