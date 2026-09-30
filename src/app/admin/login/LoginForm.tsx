"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "@/app/admin/actions";

export function LoginForm({ next, initialError }: { next: string; initialError: string | null }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, { error: initialError });

  return (
    <form action={action} style={{ display: "grid", gap: 18 }} noValidate>
      <input type="hidden" name="next" value={next} />
      <label className="field">
        <span>Email</span>
        <input className="input" type="email" name="email" autoComplete="username" required autoFocus />
      </label>
      <label className="field">
        <span>Password</span>
        <input className="input" type="password" name="password" autoComplete="current-password" required />
      </label>
      {state.error && (
        <p className="err" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn btn-solid btn-block" disabled={pending} aria-busy={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
