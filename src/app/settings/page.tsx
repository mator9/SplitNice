"use client";

import { useSession } from "next-auth/react";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import { useFetch } from "@/lib/hooks";

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
  const { data: notifData, loading: notifLoading, refetch } = useFetch<NotificationData>("/api/notifications");

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    refetch();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile</h2>
        {session?.user && (
          <div className="flex items-center gap-4">
            <Avatar src={session.user.image} name={session.user.name} size="lg" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">{session.user.name}</p>
              <p className="text-sm text-gray-500">{session.user.email}</p>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notifications
            {notifData?.unreadCount ? (
              <span className="ml-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-medium px-2 py-0.5 rounded-full">
                {notifData.unreadCount} unread
              </span>
            ) : null}
          </h2>
          {notifData?.unreadCount ? (
            <button onClick={markAllRead} className="text-sm text-emerald-600 hover:text-emerald-700">
              Mark all read
            </button>
          ) : null}
        </div>
        {notifLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin w-6 h-6 border-4 border-emerald-600 border-t-transparent rounded-full" />
          </div>
        ) : notifData?.notifications && notifData.notifications.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifData.notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 rounded-lg ${
                  notif.read
                    ? "bg-gray-50 dark:bg-gray-700/30"
                    : "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                }`}
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{notif.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{notif.message}</p>
                <p className="text-xs text-gray-500 mt-1">
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
          <p className="text-sm text-gray-500">No notifications</p>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">About</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          SplitNice is a free, open-source expense-sharing app. Track shared expenses,
          simplify debts, and settle up with friends easily.
        </p>
      </Card>
    </div>
  );
}
