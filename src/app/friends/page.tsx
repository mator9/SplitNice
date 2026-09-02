"use client";

import { useState } from "react";
import { useFetch } from "@/lib/hooks";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface FriendsData {
  friends: Array<{ id: string; name: string; email: string; image?: string }>;
  pendingReceived: Array<{ id: string; user: { id: string; name: string; email: string; image?: string } }>;
  pendingSent: Array<{ id: string; user: { id: string; name: string; email: string; image?: string } }>;
}

export default function FriendsPage() {
  const { data, loading: friendsLoading, refetch } = useFetch<FriendsData>("/api/friends");
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddFriend = async () => {
    if (!email) return;
    setLoading(true);
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
      setLoading(false);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Friends</h1>
        <Button onClick={() => setShowAdd(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Friend
        </Button>
      </div>

      {data?.pendingReceived && data.pendingReceived.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Friend Requests</h2>
          <div className="space-y-2">
            {data.pendingReceived.map((req) => (
              <Card key={req.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar src={req.user.image} name={req.user.name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{req.user.name || req.user.email}</p>
                      <p className="text-xs text-gray-500">{req.user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAccept(req.id)}>Accept</Button>
                    <Button size="sm" variant="secondary" onClick={() => handleReject(req.id)}>Decline</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {data?.pendingSent && data.pendingSent.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Pending Requests</h2>
          <div className="space-y-2">
            {data.pendingSent.map((req) => (
              <Card key={req.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar src={req.user.image} name={req.user.name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{req.user.name || req.user.email}</p>
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Your Friends {data?.friends ? `(${data.friends.length})` : ""}
        </h2>
        {friendsLoading ? (
          <LoadingSpinner />
        ) : data?.friends && data.friends.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.friends.map((friend) => (
              <Card key={friend.id} className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar src={friend.image} name={friend.name} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{friend.name || friend.email}</p>
                    <p className="text-sm text-gray-500">{friend.email}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No friends yet"
            description="Add friends to start splitting expenses"
            action={<Button onClick={() => setShowAdd(true)}>Add Friend</Button>}
          />
        )}
      </div>

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
            <p className="text-xs text-gray-500">They must have a SplitNice account to be added.</p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleAddFriend} loading={loading} disabled={!email}>Send Request</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
