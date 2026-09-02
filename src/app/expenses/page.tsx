"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useDebounce } from "@/lib/hooks";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import { ListItemSkeleton } from "@/components/ui/Skeleton";
import AddExpenseModal from "@/components/AddExpenseModal";

interface Expense {
  id: string;
  description: string;
  amount: string;
  currency: string;
  date: string;
  category?: string;
  splitType: string;
  paidBy: { id: string; name: string; email: string; image?: string };
  group?: { id: string; name: string };
  splits: Array<{ userId: string; amount: string; user: { id: string; name: string } }>;
}

export default function ExpensesPage() {
  const { data: session } = useSession();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);

    fetch(`/api/search?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setExpenses(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [debouncedSearch, sortBy, sortOrder]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Expenses</h1>
        <Button onClick={() => setShowAddExpense(true)}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Add Expense</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Search & sort */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          <select
            className="px-3 py-2 border rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-gray-700 dark:text-gray-200"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">By date</option>
            <option value="amount">By amount</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="px-3 py-2 border rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-gray-700 dark:text-gray-200"
          >
            {sortOrder === "desc" ? "↓ Newest" : "↑ Oldest"}
          </button>
        </div>
      </div>

      {/* Expenses list */}
      {loading ? (
        <Card className="divide-y divide-gray-50 dark:divide-slate-700/40">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-4 sm:px-5">
              <ListItemSkeleton />
            </div>
          ))}
        </Card>
      ) : expenses.length > 0 ? (
        <Card className="divide-y divide-gray-50 dark:divide-slate-700/40">
          {expenses.map((expense) => {
            const myShare = expense.splits.find((s) => s.userId === session?.user?.id);
            const iPaid = expense.paidBy.id === session?.user?.id;

            return (
              <div key={expense.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                <Avatar src={expense.paidBy.image} name={expense.paidBy.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{expense.description}</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 flex-wrap">
                    <span>{expense.paidBy.name} paid</span>
                    <span className="text-gray-300">·</span>
                    <span>{new Date(expense.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                    {expense.group && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span>{expense.group.name}</span>
                      </>
                    )}
                    {expense.category && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span>{expense.category}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                    ${parseFloat(expense.amount).toFixed(2)}
                  </p>
                  {myShare && (
                    <p className={`text-[11px] font-medium tabular-nums ${iPaid ? "text-emerald-600" : "text-orange-600"}`}>
                      {iPaid ? "lent" : "owe"} ${parseFloat(myShare.amount).toFixed(2)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                  title="Delete expense"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            );
          })}
        </Card>
      ) : (
        <EmptyState
          title={search ? "No matching expenses" : "No expenses yet"}
          description={search ? "Try a different search term" : "Add your first expense to get started"}
          action={!search ? <Button size="sm" onClick={() => setShowAddExpense(true)}>Add Expense</Button> : undefined}
        />
      )}

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
