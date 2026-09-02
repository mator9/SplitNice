"use client";

import { useState } from "react";
import { useFetch } from "@/lib/hooks";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { ListItemSkeleton } from "@/components/ui/Skeleton";

interface FriendsData {
  friends: Array<{ id: string; name: string; email: string; image?: string }>;
  pendingReceived: Array<{ id: string; user: { id: string; name: string; email: string; image?: string } }>;
  pendingSent: Array<{ id: string; user: { id: string; name: string; email: string; image?: string } }>;
}

export default function FriendsPage() {
  const { data, loading, refetch } = useFetch<FriendsData>("/api/friends");
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddFriend = async () => {
    if (!email) return;
    setSubmitLoading(true);
    setError("");
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed");
      }
      setShowAdd(false);
      setEmail("");
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    await fetch(`/api/friends/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACCEPTED" }),
    });
    refetch();
  };

  const handleReject = async (id: string) => {
    await fetch(`/api/friends/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REJECTED" }),
    });
    refetch();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Friends</h1>
        <Button onClick={() => setShowAdd(true)}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Friend
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="px-4 sm:px-5">
                <ListItemSkeleton />
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          {data?.pendingReceived && data.pendingReceived.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Friend Requests</h2>
              <Card className="divide-y divide-gray-50 dark:divide-slate-700/40">
                {data.pendingReceived.map((req) => (
                  <div key={req.id} className="flex items-center justify-between px-4 sm:px-5 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar src={req.user.image} name={req.user.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{req.user.name || req.user.email}</p>
                        <p className="text-xs text-gray-500 truncate">{req.user.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0 ml-3">
                      <Button size="sm" onClick={() => handleAccept(req.id)}>Accept</Button>
                      <Button size="sm" variant="secondary" onClick={() => handleReject(req.id)}>Decline</Button>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {data?.pendingSent && data.pendingSent.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Pending Requests</h2>
              <Card className="divide-y divide-gray-50 dark:divide-slate-700/40">
                {data.pendingSent.map((req) => (
                  <div key={req.id} className="flex items-center justify-between px-4 sm:px-5 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar src={req.user.image} name={req.user.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{req.user.name || req.user.email}</p>
                        <p className="text-xs text-gray-400">Pending</p>
                      </div>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Your Friends {data?.friends ? `(${data.friends.length})` : ""}
            </h2>
            {data?.friends && data.friends.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.friends.map((friend) => (
                  <Card key={friend.id} className="p-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={friend.image} name={friend.name} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{friend.name || friend.email}</p>
                        <p className="text-xs text-gray-500 truncate">{friend.email}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No friends yet"
                description="Add friends to start splitting expenses"
                action={<Button size="sm" onClick={() => setShowAdd(true)}>Add Friend</Button>}
              />
            )}
          </div>
        </>
      )}

      {showAdd && (
        <Modal isOpen onClose={() => setShowAdd(false)} title="Add Friend">
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}
            <Input
              label="Email address"
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-gray-500">They must have a SplitNice account.</p>
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
              <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleAddFriend} loading={submitLoading} disabled={!email}>Send Request</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
