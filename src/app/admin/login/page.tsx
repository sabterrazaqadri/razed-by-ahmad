import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/admin";
  const notAdmin = sp.error === "not-admin";
  return (
    <main className="login-wrap">
      <div className="login">
        <div className="wordmark" style={{ marginBottom: 30 }}>
          RAZED<span className="wordmark-sub">Shop admin</span>
        </div>
        <LoginForm next={next} initialError={notAdmin ? "This account isn't set up as the shop admin." : null} />
      </div>
    </main>
  );
}
