"use client";

import { useSession } from "next-auth/react";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import { useFetch } from "@/lib/hooks";
import { ListItemSkeleton } from "@/components/ui/Skeleton";
import Skeleton from "@/components/ui/Skeleton";

interface NotificationData {
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    link?: string;
    createdAt: string;
  }>;
  unreadCount: number;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { data: notifData, loading, refetch } = useFetch<NotificationData>("/api/notifications");

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    refetch();
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Settings</h1>

      {/* Profile */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Profile</h2>
        {session?.user ? (
          <div className="flex items-center gap-3">
            <Avatar src={session.user.image} name={session.user.name} size="lg" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{session.user.name}</p>
              <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Skeleton className="w-14 h-14 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        )}
      </Card>

      {/* Notifications */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            Notifications
            {notifData?.unreadCount ? (
              <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[11px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums">
                {notifData.unreadCount}
              </span>
            ) : null}
          </h2>
          {notifData?.unreadCount ? (
            <button onClick={markAllRead} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
              Mark all read
            </button>
          ) : null}
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <ListItemSkeleton key={i} />)}
          </div>
        ) : notifData?.notifications && notifData.notifications.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifData.notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 rounded-lg ${
                  notif.read
                    ? "bg-gray-50 dark:bg-slate-700/20"
                    : "bg-emerald-50/60 dark:bg-emerald-900/15 border border-emerald-100 dark:border-emerald-800/40"
                }`}
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{notif.title}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{notif.message}</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {new Date(notif.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No notifications</p>
        )}
      </Card>

      {/* About */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">About</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          SplitNice is a free, open-source expense-sharing app. Track shared expenses,
          simplify debts, and settle up with friends easily.
        </p>
      </Card>
    </div>
  );
}
