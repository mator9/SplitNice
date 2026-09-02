"use client";

import { useSession } from "next-auth/react";
import { useFetch } from "@/lib/hooks";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { useState } from "react";
import AddExpenseModal from "@/components/AddExpenseModal";

interface Balance {
  youOwe: string;
  youAreOwed: string;
  net: string;
  debts: Array<{
    from: { id: string; name: string; email: string; image?: string };
    to: { id: string; name: string; email: string; image?: string };
    amount: string;
  }>;
}

interface Group {
  id: string;
  name: string;
  type: string;
  members: Array<{ user: { id: string; name: string; image?: string } }>;
  _count: { expenses: number };
}

interface Expense {
  id: string;
  description: string;
  amount: string;
  currency: string;
  date: string;
  paidBy: { id: string; name: string; image?: string };
  group?: { id: string; name: string };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: balances, loading: balancesLoading } = useFetch<Balance>("/api/balances");
  const { data: groups, loading: groupsLoading } = useFetch<Group[]>("/api/groups");
  const { data: expenses, loading: expensesLoading } = useFetch<Expense[]>("/api/expenses?limit=5");
  const [showAddExpense, setShowAddExpense] = useState(false);

  const netNum = parseFloat(balances?.net || "0");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Here&apos;s your expense summary</p>
        </div>
        <Button onClick={() => setShowAddExpense(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">You owe</p>
          {balancesLoading ? (
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-orange-600">${balances?.youOwe || "0.00"}</p>
          )}
        </Card>
        <Card className="p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">You are owed</p>
          {balancesLoading ? (
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-emerald-600">${balances?.youAreOwed || "0.00"}</p>
          )}
        </Card>
        <Card className="p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Net balance</p>
          {balancesLoading ? (
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <p className={`text-2xl font-bold ${netNum >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
              {netNum >= 0 ? "+" : ""}${balances?.net || "0.00"}
            </p>
          )}
        </Card>
      </div>

      {balances?.debts && balances.debts.length > 0 && (
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Outstanding Balances</h2>
          <div className="space-y-3">
            {balances.debts.map((debt, i) => {
              const iOwe = debt.from.id === session?.user?.id;
              const other = iOwe ? debt.to : debt.from;
              return (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar src={other.image} name={other.name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {other.name || other.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {iOwe ? "you owe" : "owes you"}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold ${iOwe ? "text-orange-600" : "text-emerald-600"}`}>
                    ${debt.amount}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Expenses</h2>
            <Link href="/expenses" className="text-sm text-emerald-600 hover:text-emerald-700">
              View all
            </Link>
          </div>
          {expensesLoading ? (
            <LoadingSpinner />
          ) : expenses && expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {expense.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {expense.paidBy.name} &middot;{" "}
                      {new Date(expense.date).toLocaleDateString()}
                      {expense.group && ` &middot; ${expense.group.name}`}
                    </p>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    ${parseFloat(expense.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No expenses yet"
              description="Start by adding your first expense"
              action={<Button size="sm" onClick={() => setShowAddExpense(true)}>Add Expense</Button>}
            />
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Groups</h2>
            <Link href="/groups" className="text-sm text-emerald-600 hover:text-emerald-700">
              View all
            </Link>
          </div>
          {groupsLoading ? (
            <LoadingSpinner />
          ) : groups && groups.length > 0 ? (
            <div className="space-y-3">
              {groups.slice(0, 5).map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {group.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {group.members.length} members &middot; {group._count.expenses} expenses
                    </p>
                  </div>
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                    {group.type.toLowerCase()}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No groups yet"
              description="Create a group to start sharing expenses"
              action={
                <Link href="/groups">
                  <Button size="sm">Create Group</Button>
                </Link>
              }
            />
          )}
        </Card>
      </div>

      {showAddExpense && (
        <AddExpenseModal
          onClose={() => setShowAddExpense(false)}
          onSuccess={() => {
            setShowAddExpense(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
