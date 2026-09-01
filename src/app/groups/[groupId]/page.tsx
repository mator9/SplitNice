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
import AddExpenseModal from "@/components/AddExpenseModal";

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

interface BalanceData {
  myBalance: { youOwe: string; youAreOwed: string; net: string };
  simplifiedDebts: Array<{ from: string; to: string; amount: string }>;
  memberBalances: Array<{
    user: { id: string; name: string; email: string; image?: string };
    youOwe: string;
    youAreOwed: string;
    net: string;
  }>;
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const groupId = params.groupId as string;
  const { data: group, refetch } = useFetch<GroupDetail>(`/api/groups/${groupId}`);
  const { data: balances, refetch: refetchBalances } = useFetch<BalanceData>(`/api/groups/${groupId}/balances`);
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

  if (!group) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
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

  const netNum = parseFloat(balances?.myBalance?.net || "0");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => router.push("/groups")} className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Groups
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{group.name}</h1>
          {group.description && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">{group.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddExpense(true)}>Add Expense</Button>
          <Button variant="secondary" onClick={() => setShowSettle(true)}>Settle Up</Button>
        </div>
      </div>

      {balances && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-sm text-gray-500 mb-1">You owe</p>
            <p className="text-xl font-bold text-orange-600">${balances.myBalance.youOwe}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500 mb-1">You are owed</p>
            <p className="text-xl font-bold text-emerald-600">${balances.myBalance.youAreOwed}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500 mb-1">Net balance</p>
            <p className={`text-xl font-bold ${netNum >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
              {netNum >= 0 ? "+" : ""}${balances.myBalance.net}
            </p>
          </Card>
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {(["expenses", "balances", "members"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "expenses" && (
        <div>
          {group.expenses.length > 0 ? (
            <div className="space-y-3">
              {group.expenses.map((expense) => (
                <Card key={expense.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar src={expense.paidBy.image} name={expense.paidBy.name} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{expense.description}</p>
                        <p className="text-xs text-gray-500">
                          {expense.paidBy.name} paid &middot; {new Date(expense.date).toLocaleDateString()} &middot;{" "}
                          {expense.splitType.toLowerCase()} split
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      ${parseFloat(expense.amount).toFixed(2)}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No expenses yet"
              description="Add your first expense to this group"
              action={<Button onClick={() => setShowAddExpense(true)}>Add Expense</Button>}
            />
          )}
        </div>
      )}

      {tab === "balances" && balances && (
        <div className="space-y-4">
          {balances.simplifiedDebts.length > 0 ? (
            <>
              <h3 className="font-semibold text-gray-900 dark:text-white">Simplified Debts</h3>
              <div className="space-y-2">
                {balances.simplifiedDebts.map((debt, i) => {
                  const fromMember = group.members.find((m) => m.user.id === debt.from);
                  const toMember = group.members.find((m) => m.user.id === debt.to);
                  return (
                    <Card key={i} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar src={fromMember?.user.image} name={fromMember?.user.name} size="sm" />
                          <span className="text-sm font-medium">{fromMember?.user.name || "Unknown"}</span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <Avatar src={toMember?.user.image} name={toMember?.user.name} size="sm" />
                          <span className="text-sm font-medium">{toMember?.user.name || "Unknown"}</span>
                        </div>
                        <span className="font-semibold text-orange-600">${debt.amount}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyState title="All settled up!" description="No outstanding balances in this group" />
          )}
        </div>
      )}

      {tab === "members" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowAddMember(true)}>Add Member</Button>
          </div>
          {group.members.map((member) => (
            <Card key={member.userId} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar src={member.user.image} name={member.user.name} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {member.user.name || member.user.email}
                    </p>
                    <p className="text-xs text-gray-500">{member.user.email}</p>
                  </div>
                </div>
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                  {member.role.toLowerCase()}
                </span>
              </div>
            </Card>
          ))}
          {isAdmin && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
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
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowAddMember(false)}>Cancel</Button>
              <Button onClick={handleAddMember} loading={addMemberLoading} disabled={!memberEmail}>Add</Button>
            </div>
          </div>
        </Modal>
      )}

      {showSettle && (
        <Modal isOpen onClose={() => setShowSettle(false)} title="Record Settlement">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pay to</label>
              <select
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-600"
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
            <div className="flex justify-end gap-3">
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
