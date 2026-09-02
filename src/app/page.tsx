import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-white via-emerald-50/30 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="flex items-center justify-between px-5 sm:px-8 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">SplitNice</span>
        </div>
        <Link
          href="/login"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-xs"
        >
          Sign In
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-24">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-[1.1] tracking-tight">
            Split expenses,
            <br />
            <span className="text-emerald-600">not friendships</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 mt-5 max-w-lg mx-auto leading-relaxed">
            Track shared expenses, settle debts, and keep things fair with your friends, roommates, and travel buddies.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 mt-8 bg-emerald-600 text-white rounded-xl font-semibold text-sm sm:text-base hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            Get Started Free
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-20">
          {[
            {
              title: "Track Expenses",
              desc: "Add expenses with flexible splits — equal, percentage, exact amounts, or shares.",
              icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
            },
            {
              title: "Simplify Debts",
              desc: "Smart debt simplification reduces the number of payments needed to settle up.",
              icon: "M13 10V3L4 14h7v7l9-11h-7z",
            },
            {
              title: "Settle Up",
              desc: "Record payments, track settlement history, and keep everyone on the same page.",
              icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white dark:bg-slate-800/60 rounded-2xl p-6 shadow-xs border border-gray-100 dark:border-slate-700/60"
            >
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">{feature.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
