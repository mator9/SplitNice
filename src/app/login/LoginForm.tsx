"use client";

import { useActionState, useEffect, useRef } from "react";
import { credentialsLogin, type AuthActionResult } from "@/app/(auth)/actions";

export default function LoginForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [state, formAction, pending] = useActionState<AuthActionResult | undefined, FormData>(
    credentialsLogin,
    undefined
  );

  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.error) {
      passwordRef.current?.focus();
    }
  }, [state]);

  const emailValue = state?.email ?? defaultEmail;

  return (
    <form action={formAction} className="space-y-3.5">
      {state?.error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={emailValue}
          key={emailValue}
          className="w-full px-3 py-2 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Password
        </label>
        <input
          ref={passwordRef}
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full px-3 py-2 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          placeholder="Enter your password"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm mt-1 active:scale-[0.98]"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
