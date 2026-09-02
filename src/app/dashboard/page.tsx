"use client";

import { useSession } from "next-auth/react";
import { useFetch } from "@/lib/hooks";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { BalanceSkeleton, ListItemSkeleton } from "@/components/ui/Skeleton";
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
  const { data: balances, loading: loadingBalances } = useFetch<Balance>("/api/balances");
  const { data: groups, loading: loadingGroups } = useFetch<Group[]>("/api/groups");
  const { data: expenses, loading: loadingExpenses } = useFetch<Expense[]>("/api/expenses?limit=5");
  const [showAddExpense, setShowAddExpense] = useState(false);

  const netNum = parseFloat(balances?.net || "0");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {session?.user?.name ? `Hi, ${session.user.name.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Your expense summary</p>
        </div>
        <Button onClick={() => setShowAddExpense(true)} size="md">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Add Expense</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Balance cards */}
      {loadingBalances ? (
        <div className="grid grid-cols-3 gap-3">
          <BalanceSkeleton />
          <BalanceSkeleton />
          <BalanceSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">You owe</p>
            <p className="text-lg sm:text-xl font-bold text-orange-600 mt-1 tabular-nums">${balances?.youOwe || "0.00"}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Owed to you</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-600 mt-1 tabular-nums">${balances?.youAreOwed || "0.00"}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Net</p>
            <p className={`text-lg sm:text-xl font-bold mt-1 tabular-nums ${netNum >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
              {netNum >= 0 ? "+" : ""}${balances?.net || "0.00"}
            </p>
          </Card>
        </div>
      )}

      {/* Outstanding balances */}
      {balances?.debts && balances.debts.length > 0 && (
        <Card className="p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Outstanding</h2>
          <div className="space-y-2.5">
            {balances.debts.map((debt, i) => {
              const iOwe = debt.from.id === session?.user?.id;
              const other = iOwe ? debt.to : debt.from;
              return (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={other.image} name={other.name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {other.name || other.email}
                      </p>
                      <p className="text-xs text-gray-500">{iOwe ? "you owe" : "owes you"}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${iOwe ? "text-orange-600" : "text-emerald-600"}`}>
                    ${debt.amount}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent expenses */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Expenses</h2>
            <Link href="/expenses" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
              View all
            </Link>
          </div>
          {loadingExpenses ? (
            <div className="divide-y divide-gray-50 dark:divide-slate-700/40">
              {[1, 2, 3].map((i) => <ListItemSkeleton key={i} />)}
            </div>
          ) : expenses && expenses.length > 0 ? (
            <div className="divide-y divide-gray-50 dark:divide-slate-700/40">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {expense.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {expense.paidBy.name} &middot; {new Date(expense.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      {expense.group && ` · ${expense.group.name}`}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 ml-3 tabular-nums">
                    ${parseFloat(expense.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No expenses yet"
              description="Add your first expense to get started"
              action={<Button size="sm" onClick={() => setShowAddExpense(true)}>Add Expense</Button>}
            />
          )}
        </Card>

        {/* Groups */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Your Groups</h2>
            <Link href="/groups" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
              View all
            </Link>
          </div>
          {loadingGroups ? (
            <div className="divide-y divide-gray-50 dark:divide-slate-700/40">
              {[1, 2, 3].map((i) => <ListItemSkeleton key={i} />)}
            </div>
          ) : groups && groups.length > 0 ? (
            <div className="divide-y divide-gray-50 dark:divide-slate-700/40">
              {groups.slice(0, 5).map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 -mx-2 px-2 rounded-lg hover:bg-gray-50/60 dark:hover:bg-slate-700/20 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {group.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {group.members.length} members · {group._count.expenses} expenses
                    </p>
                  </div>
                  <span className="text-[11px] bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full font-medium ml-3">
                    {group.type.toLowerCase()}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No groups yet"
              description="Create a group to split expenses"
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
