"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type AuthActionResult = {
  error?: string;
  email?: string;
};

export async function signup(
  _prev: AuthActionResult | undefined,
  formData: FormData
): Promise<AuthActionResult> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const hash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, email, password: hash },
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as Record<string, unknown>).digest === "string" &&
      ((err as Record<string, unknown>).digest as string).startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    redirect(`/login?registered=1&email=${encodeURIComponent(email)}`);
  }

  return {};
}

export async function credentialsLogin(
  _prev: AuthActionResult | undefined,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;

  if (!email || !password) {
    return { error: "Email and password are required", email: email || "" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as Record<string, unknown>).digest === "string" &&
      ((err as Record<string, unknown>).digest as string).startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    return { error: "Invalid email or password", email };
  }

  return {};
}
