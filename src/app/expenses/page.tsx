"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useDebounce } from "@/lib/hooks";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
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
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);

    fetch(`/api/search?${params}`)
      .then((r) => r.json())
      .then(setExpenses)
      .catch(() => {});
  }, [debouncedSearch, sortBy, sortOrder]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expenses</h1>
        <Button onClick={() => setShowAddExpense(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Expense
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-600"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Sort by date</option>
            <option value="amount">Sort by amount</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-600 hover:bg-gray-50"
          >
            {sortOrder === "desc" ? "Newest" : "Oldest"}
          </button>
        </div>
      </div>

      {expenses.length > 0 ? (
        <div className="space-y-3">
          {expenses.map((expense) => {
            const myShare = expense.splits.find((s) => s.userId === session?.user?.id);
            const iPaid = expense.paidBy.id === session?.user?.id;

            return (
              <Card key={expense.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar src={expense.paidBy.image} name={expense.paidBy.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{expense.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span>{expense.paidBy.name} paid</span>
                        <span>&middot;</span>
                        <span>{new Date(expense.date).toLocaleDateString()}</span>
                        {expense.group && (
                          <>
                            <span>&middot;</span>
                            <span>{expense.group.name}</span>
                          </>
                        )}
                        {expense.category && (
                          <>
                            <span>&middot;</span>
                            <span>{expense.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      ${parseFloat(expense.amount).toFixed(2)}
                    </p>
                    {myShare && (
                      <p className={`text-xs ${iPaid ? "text-emerald-600" : "text-orange-600"}`}>
                        {iPaid ? "you lent" : "you owe"} ${parseFloat(myShare.amount).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="ml-3 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Delete expense"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={search ? "No matching expenses" : "No expenses yet"}
          description={search ? "Try a different search term" : "Add your first expense to get started"}
          action={!search ? <Button onClick={() => setShowAddExpense(true)}>Add Expense</Button> : undefined}
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
