"use client";

import { useFetch } from "@/lib/hooks";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";

interface Activity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  user: { id: string; name: string; email: string; image?: string };
  group?: { id: string; name: string };
  expense?: { id: string; description: string; amount: string };
  settlement?: { id: string; amount: string };
}

export default function ActivityPage() {
  const { data: activities } = useFetch<Activity[]>("/api/activity");

  const typeIcon = (type: string) => {
    switch (type) {
      case "EXPENSE_CREATED":
      case "EXPENSE_EDITED":
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case "SETTLEMENT_CREATED":
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case "GROUP_CREATED":
      case "MEMBER_ADDED":
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity</h1>

      {activities && activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity) => (
            <Card key={activity.id} className="p-4">
              <div className="flex items-start gap-3">
                {typeIcon(activity.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Avatar src={activity.user.image} name={activity.user.name} size="sm" />
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      <span className="font-medium">{activity.user.name || activity.user.email}</span>{" "}
                      {activity.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 ml-10">
                    {activity.group && (
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300">
                        {activity.group.name}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No activity yet"
          description="Activity will appear here when expenses and settlements are recorded"
        />
      )}
    </div>
  );
}
