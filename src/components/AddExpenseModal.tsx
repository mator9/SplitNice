"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

interface Group {
  id: string;
  name: string;
  members: Array<{
    user: { id: string; name: string; email: string };
  }>;
}

type Participant = { userId: string; name: string; amount: string; percentage: string; shares: number };

interface AddExpenseModalProps {
  onClose: () => void;
  onSuccess: () => void;
  groupId?: string;
}

export default function AddExpenseModal({ onClose, onSuccess, groupId }: AddExpenseModalProps) {
  const { data: session } = useSession();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(groupId || "");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [splitType, setSplitType] = useState<"EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES">("EQUAL");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    fetch("/api/groups")
      .then((r) => r.json())
      .then(setGroups)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      const group = groups.find((g) => g.id === selectedGroupId);
      if (group) {
        setParticipants(
          group.members.map((m) => ({
            userId: m.user.id,
            name: m.user.name || m.user.email,
            amount: "",
            percentage: "",
            shares: 1,
          }))
        );
        return;
      }
    }
    if (session?.user?.id) {
      setParticipants([
        {
          userId: session.user.id,
          name: session.user.name || session.user.email || "",
          amount: "",
          percentage: "",
          shares: 1,
        },
      ]);
    }
  }, [selectedGroupId, groups, session]);

  const handleGroupChange = useCallback(
    (newGroupId: string) => {
      setSelectedGroupId(newGroupId);
    },
    []
  );

  const handleSubmit = async () => {
    if (!description || !amount || !session?.user?.id) return;
    setLoading(true);
    setError("");

    try {
      const splits = participants.map((p) => ({
        userId: p.userId,
        amount: p.amount || undefined,
        percentage: p.percentage || undefined,
        shares: p.shares || 1,
      }));

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          amount,
          currency,
          date,
          category: category || undefined,
          notes: notes || undefined,
          splitType,
          groupId: selectedGroupId || undefined,
          paidById: session.user.id,
          splits,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.fieldErrors ? "Validation error" : data.error || "Failed to create expense");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const isValid = description.trim().length > 0 && parseFloat(amount) > 0;

  return (
    <Modal isOpen onClose={onClose} title="Add Expense" size="lg">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <Input
          label="Description"
          placeholder="What was this expense for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Select
            label="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            options={[
              { value: "USD", label: "USD ($)" },
              { value: "EUR", label: "EUR (€)" },
              { value: "GBP", label: "GBP (£)" },
              { value: "INR", label: "INR (₹)" },
              { value: "CAD", label: "CAD" },
              { value: "AUD", label: "AUD" },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            label="Category (optional)"
            placeholder="e.g. Food"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        <Select
          label="Group (optional)"
          value={selectedGroupId}
          onChange={(e) => handleGroupChange(e.target.value)}
          options={[
            { value: "", label: "No group" },
            ...groups.map((g) => ({ value: g.id, label: g.name })),
          ]}
        />

        <Select
          label="Split type"
          value={splitType}
          onChange={(e) => setSplitType(e.target.value as typeof splitType)}
          options={[
            { value: "EQUAL", label: "Equal split" },
            { value: "EXACT", label: "Exact amounts" },
            { value: "PERCENTAGE", label: "By percentage" },
            { value: "SHARES", label: "By shares/ratio" },
          ]}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Participants ({participants.length})
          </label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto overscroll-contain">
            {participants.map((p, idx) => (
              <div key={p.userId} className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700/20 rounded-lg p-2.5">
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100 flex-1 truncate">
                  {p.name}
                </span>
                {splitType === "EXACT" && (
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    className="w-20 px-2 py-1 border border-gray-200 rounded-md text-xs dark:bg-slate-800 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={p.amount}
                    onChange={(e) => {
                      const newP = [...participants];
                      newP[idx].amount = e.target.value;
                      setParticipants(newP);
                    }}
                  />
                )}
                {splitType === "PERCENTAGE" && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="%"
                      className="w-16 px-2 py-1 border border-gray-200 rounded-md text-xs dark:bg-slate-800 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      value={p.percentage}
                      onChange={(e) => {
                        const newP = [...participants];
                        newP[idx].percentage = e.target.value;
                        setParticipants(newP);
                      }}
                    />
                    <span className="text-xs text-gray-400">%</span>
                  </div>
                )}
                {splitType === "SHARES" && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      className="w-14 px-2 py-1 border border-gray-200 rounded-md text-xs dark:bg-slate-800 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      value={p.shares}
                      onChange={(e) => {
                        const newP = [...participants];
                        newP[idx].shares = parseInt(e.target.value) || 1;
                        setParticipants(newP);
                      }}
                    />
                    <span className="text-xs text-gray-400">shares</span>
                  </div>
                )}
                {participants.length > 1 && (
                  <button
                    onClick={() => setParticipants(participants.filter((_, i) => i !== idx))}
                    className="text-gray-300 hover:text-red-500 transition-colors p-0.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <Input
          label="Notes (optional)"
          placeholder="Any additional details..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-700 sticky bottom-0 bg-white dark:bg-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!isValid}>
            Add Expense
          </Button>
        </div>
      </div>
    </Modal>
  );
}
