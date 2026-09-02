"use client";

import { useFetch } from "@/lib/hooks";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import { ListItemSkeleton } from "@/components/ui/Skeleton";

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

const typeConfig: Record<string, { bg: string; iconColor: string; icon: string }> = {
  EXPENSE_CREATED: { bg: "bg-blue-50 dark:bg-blue-900/20", iconColor: "text-blue-600", icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
  EXPENSE_EDITED: { bg: "bg-blue-50 dark:bg-blue-900/20", iconColor: "text-blue-600", icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
  SETTLEMENT_CREATED: { bg: "bg-emerald-50 dark:bg-emerald-900/20", iconColor: "text-emerald-600", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  GROUP_CREATED: { bg: "bg-violet-50 dark:bg-violet-900/20", iconColor: "text-violet-600", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  MEMBER_ADDED: { bg: "bg-violet-50 dark:bg-violet-900/20", iconColor: "text-violet-600", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
};

const defaultConfig = { bg: "bg-gray-50 dark:bg-slate-700/30", iconColor: "text-gray-500", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" };

export default function ActivityPage() {
  const { data: activities, loading } = useFetch<Activity[]>("/api/activity");

  return (
    <div className="space-y-5">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Activity</h1>

      {loading ? (
        <Card className="divide-y divide-gray-50 dark:divide-slate-700/40">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-4 sm:px-5">
              <ListItemSkeleton />
            </div>
          ))}
        </Card>
      ) : activities && activities.length > 0 ? (
        <Card className="divide-y divide-gray-50 dark:divide-slate-700/40">
          {activities.map((activity) => {
            const config = typeConfig[activity.type] || defaultConfig;
            return (
              <div key={activity.id} className="flex items-start gap-3 px-4 sm:px-5 py-3.5">
                <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <svg className={`w-3.5 h-3.5 ${config.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Avatar src={activity.user.image} name={activity.user.name} size="sm" />
                    <p className="text-sm text-gray-900 dark:text-gray-100 leading-snug">
                      <span className="font-medium">{activity.user.name || activity.user.email}</span>{" "}
                      <span className="text-gray-600 dark:text-gray-400">{activity.description}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 ml-10">
                    {activity.group && (
                      <span className="text-[11px] bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300 font-medium">
                        {activity.group.name}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
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
            );
          })}
        </Card>
      ) : (
        <EmptyState
          title="No activity yet"
          description="Activity will appear here when expenses and settlements are recorded"
        />
      )}
    </div>
  );
}
