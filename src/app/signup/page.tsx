import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignupForm from "./SignupForm";

export default async function SignupPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-white via-emerald-50/30 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-7">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Create your account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Start splitting expenses with friends</p>
        </div>

        <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/60 p-6">
          <SignupForm />
        </div>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-5">
          Already have an account?{" "}
          <a href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
