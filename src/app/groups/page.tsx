"use client";

import { useState } from "react";
import Link from "next/link";
import { useFetch } from "@/lib/hooks";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Avatar from "@/components/ui/Avatar";

interface Group {
  id: string;
  name: string;
  description?: string;
  type: string;
  members: Array<{
    user: { id: string; name: string; email: string; image?: string };
  }>;
  _count: { expenses: number };
}

export default function GroupsPage() {
  const { data: groups, loading: groupsLoading, refetch } = useFetch<Group[]>("/api/groups");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("OTHER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, type }),
      });
      if (!res.ok) throw new Error("Failed to create group");
      setShowCreate(false);
      setName("");
      setDescription("");
      setType("OTHER");
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Groups</h1>
        <Button onClick={() => setShowCreate(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Group
        </Button>
      </div>

      {groupsLoading ? (
        <LoadingSpinner />
      ) : groups && groups.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <Card hover className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                    {group.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                    {group.type.toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {group.members.slice(0, 5).map((m) => (
                      <Avatar key={m.user.id} src={m.user.image} name={m.user.name} size="sm" className="ring-2 ring-white dark:ring-gray-800" />
                    ))}
                    {group.members.length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-medium ring-2 ring-white dark:ring-gray-800">
                        +{group.members.length - 5}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {group._count.expenses} expenses
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          title="No groups yet"
          description="Create your first group to start splitting expenses with friends"
          action={<Button onClick={() => setShowCreate(true)}>Create Group</Button>}
        />
      )}

      {showCreate && (
        <Modal isOpen onClose={() => setShowCreate(false)} title="Create Group">
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}
            <Input label="Group name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Summer Trip 2026" />
            <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this group for?" />
            <Select
              label="Group type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[
                { value: "OTHER", label: "General" },
                { value: "TRIP", label: "Trip" },
                { value: "APARTMENT", label: "Apartment" },
                { value: "COUPLE", label: "Couple" },
                { value: "EVENT", label: "Event" },
              ]}
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} loading={loading} disabled={!name}>Create Group</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
