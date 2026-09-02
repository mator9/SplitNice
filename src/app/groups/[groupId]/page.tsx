"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useFetch } from "@/lib/hooks";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton, { BalanceSkeleton, ListItemSkeleton } from "@/components/ui/Skeleton";
import AddExpenseModal from "@/components/AddExpenseModal";
import { formatMoney } from "@/lib/money";

interface GroupDetail {
  id: string;
  name: string;
  description?: string;
  type: string;
  createdById: string;
  members: Array<{
    userId: string;
    role: string;
    user: { id: string; name: string; email: string; image?: string };
  }>;
  expenses: Array<{
    id: string;
    description: string;
    amount: string;
    currency: string;
    date: string;
    splitType: string;
    paidBy: { id: string; name: string; image?: string };
    splits: Array<{ userId: string; amount: string; user: { id: string; name: string } }>;
  }>;
}

interface CurrencyBalance {
  currency: string;
  youOwe: string;
  youAreOwed: string;
  net: string;
}

interface BalanceData {
  balanceByCurrency: CurrencyBalance[];
  simplifiedDebts: Array<{ from: string; to: string; amount: string; currency: string }>;
  memberBalancesByCurrency: Array<{
    currency: string;
    balances: Array<{
      user: { id: string; name: string; email: string; image?: string };
      youOwe: string;
      youAreOwed: string;
      net: string;
    }>;
  }>;
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const groupId = params.groupId as string;
  const { data: group, loading: loadingGroup, refetch } = useFetch<GroupDetail>(`/api/groups/${groupId}`);
  const { data: balances, loading: loadingBalances, refetch: refetchBalances } = useFetch<BalanceData>(`/api/groups/${groupId}/balances`);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showSettle, setShowSettle] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState("");
  const [settleToId, setSettleToId] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [settleLoading, setSettleLoading] = useState(false);
  const [tab, setTab] = useState<"expenses" | "balances" | "members">("expenses");

  if (loadingGroup) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <BalanceSkeleton />
          <BalanceSkeleton />
          <BalanceSkeleton />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <ListItemSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <EmptyState title="Group not found" description="This group may have been deleted or you don't have access." />
    );
  }

  const isAdmin = group.members.some(
    (m) => m.user.id === session?.user?.id && m.role === "ADMIN"
  );

  const handleAddMember = async () => {
    setAddMemberLoading(true);
    setAddMemberError("");
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: memberEmail }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add member");
      }
      setShowAddMember(false);
      setMemberEmail("");
      refetch();
    } catch (err) {
      setAddMemberError(err instanceof Error ? err.message : "Error");
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleSettle = async () => {
    if (!settleToId || !settleAmount || !session?.user?.id) return;
    setSettleLoading(true);
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: settleAmount,
          fromId: session.user.id,
          toId: settleToId,
          groupId,
        }),
      });
      if (!res.ok) throw new Error("Failed to record settlement");
      setShowSettle(false);
      setSettleToId("");
      setSettleAmount("");
      refetchBalances();
    } catch {
      // handle error
    } finally {
      setSettleLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm("Are you sure you want to archive this group?")) return;
    await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
    router.push("/groups");
  };

  const currencyBalances = balances?.balanceByCurrency || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button onClick={() => router.push("/groups")} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-1.5 inline-flex items-center gap-1 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Groups
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight truncate">{group.name}</h1>
          {group.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{group.description}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" onClick={() => setShowAddExpense(true)}>
            <span className="hidden sm:inline">Add Expense</span>
            <span className="sm:hidden">Expense</span>
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowSettle(true)}>
            <span className="hidden sm:inline">Settle Up</span>
            <span className="sm:hidden">Settle</span>
          </Button>
        </div>
      </div>

      {/* Balance cards */}
      {loadingBalances ? (
        <div className="grid grid-cols-3 gap-3">
          <BalanceSkeleton />
          <BalanceSkeleton />
          <BalanceSkeleton />
        </div>
      ) : balances && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3.5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">You owe</p>
            {currencyBalances.length > 0 ? currencyBalances.map((cb) => (
              <p key={cb.currency} className="text-base sm:text-lg font-bold text-orange-600 mt-0.5 tabular-nums">
                {formatMoney(cb.youOwe, cb.currency)}
              </p>
            )) : (
              <p className="text-base sm:text-lg font-bold text-orange-600 mt-0.5 tabular-nums">{formatMoney("0.00")}</p>
            )}
          </Card>
          <Card className="p-3.5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Owed to you</p>
            {currencyBalances.length > 0 ? currencyBalances.map((cb) => (
              <p key={cb.currency} className="text-base sm:text-lg font-bold text-emerald-600 mt-0.5 tabular-nums">
                {formatMoney(cb.youAreOwed, cb.currency)}
              </p>
            )) : (
              <p className="text-base sm:text-lg font-bold text-emerald-600 mt-0.5 tabular-nums">{formatMoney("0.00")}</p>
            )}
          </Card>
          <Card className="p-3.5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Net</p>
            {currencyBalances.length > 0 ? currencyBalances.map((cb) => {
              const netNum = parseFloat(cb.net);
              return (
                <p key={cb.currency} className={`text-base sm:text-lg font-bold mt-0.5 tabular-nums ${netNum >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
                  {netNum >= 0 ? "+" : ""}{formatMoney(cb.net, cb.currency)}
                </p>
              );
            }) : (
              <p className="text-base sm:text-lg font-bold text-emerald-600 mt-0.5 tabular-nums">+{formatMoney("0.00")}</p>
            )}
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0.5 bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg">
        {(["expenses", "balances", "members"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
              tab === t
                ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "expenses" && (
        <div>
          {group.expenses.length > 0 ? (
            <Card className="divide-y divide-gray-50 dark:divide-slate-700/40">
              {group.expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between px-4 sm:px-5 py-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Avatar src={expense.paidBy.image} name={expense.paidBy.name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{expense.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {expense.paidBy.name} paid · {new Date(expense.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {expense.splitType.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 ml-3 tabular-nums">
                    {formatMoney(expense.amount, expense.currency)}
                  </span>
                </div>
              ))}
            </Card>
          ) : (
            <EmptyState
              title="No expenses yet"
              description="Add your first expense to this group"
              action={<Button size="sm" onClick={() => setShowAddExpense(true)}>Add Expense</Button>}
            />
          )}
        </div>
      )}

      {tab === "balances" && balances && (
        <div className="space-y-3">
          {balances.simplifiedDebts.length > 0 ? (
            <Card className="divide-y divide-gray-50 dark:divide-slate-700/40">
              {balances.simplifiedDebts.map((debt, i) => {
                const fromMember = group.members.find((m) => m.user.id === debt.from);
                const toMember = group.members.find((m) => m.user.id === debt.to);
                return (
                  <div key={i} className="flex items-center justify-between px-4 sm:px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar src={fromMember?.user.image} name={fromMember?.user.name} size="sm" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{fromMember?.user.name || "Unknown"}</span>
                      <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <Avatar src={toMember?.user.image} name={toMember?.user.name} size="sm" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{toMember?.user.name || "Unknown"}</span>
                    </div>
                    <span className="font-semibold text-sm text-orange-600 tabular-nums ml-3">{formatMoney(debt.amount, debt.currency)}</span>
                  </div>
                );
              })}
            </Card>
          ) : (
            <EmptyState title="All settled up!" description="No outstanding balances in this group" />
          )}
        </div>
      )}

      {tab === "members" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" variant="secondary" onClick={() => setShowAddMember(true)}>Add Member</Button>
          </div>
          <Card className="divide-y divide-gray-50 dark:divide-slate-700/40">
            {group.members.map((member) => (
              <div key={member.userId} className="flex items-center justify-between px-4 sm:px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar src={member.user.image} name={member.user.name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {member.user.name || member.user.email}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
                  </div>
                </div>
                <span className="text-[11px] bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full font-medium">
                  {member.role.toLowerCase()}
                </span>
              </div>
            ))}
          </Card>
          {isAdmin && (
            <div className="pt-2">
              <Button variant="danger" size="sm" onClick={handleDeleteGroup}>
                Archive Group
              </Button>
            </div>
          )}
        </div>
      )}

      {showAddExpense && (
        <AddExpenseModal
          groupId={groupId}
          onClose={() => setShowAddExpense(false)}
          onSuccess={() => {
            setShowAddExpense(false);
            refetch();
            refetchBalances();
          }}
        />
      )}

      {showAddMember && (
        <Modal isOpen onClose={() => setShowAddMember(false)} title="Add Member">
          <div className="space-y-4">
            {addMemberError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                {addMemberError}
              </div>
            )}
            <Input
              label="Email address"
              type="email"
              placeholder="friend@example.com"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
              <Button variant="secondary" onClick={() => setShowAddMember(false)}>Cancel</Button>
              <Button onClick={handleAddMember} loading={addMemberLoading} disabled={!memberEmail}>Add</Button>
            </div>
          </div>
        </Modal>
      )}

      {showSettle && (
        <Modal isOpen onClose={() => setShowSettle(false)} title="Record Payment">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Pay to</label>
              <select
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                value={settleToId}
                onChange={(e) => setSettleToId(e.target.value)}
              >
                <option value="">Select member</option>
                {group.members
                  .filter((m) => m.user.id !== session?.user?.id)
                  .map((m) => (
                    <option key={m.user.id} value={m.user.id}>{m.user.name || m.user.email}</option>
                  ))}
              </select>
            </div>
            <Input
              label="Amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={settleAmount}
              onChange={(e) => setSettleAmount(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
              <Button variant="secondary" onClick={() => setShowSettle(false)}>Cancel</Button>
              <Button onClick={handleSettle} loading={settleLoading} disabled={!settleToId || !settleAmount}>
                Record Payment
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
