"use client";

// Shared login / signup form. `mode` is "login" or "signup".
import { useState } from "react";
import Link from "next/link";

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/${isSignup ? "signup" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (data.ok) {
        window.location.href = "/dashboard";
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center overflow-hidden px-6">
      {/* Soft animated backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0" />
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl animate-blob" />
        <div
          className="absolute -right-24 bottom-24 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl animate-blob"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <Link href="/" className="animate-fade-up mb-6 text-center text-2xl font-bold tracking-tight">
        saas<span className="text-accent">evenly</span>
      </Link>
      <div
        className="animate-fade-up rounded-2xl border border-neutral-200 bg-white/90 p-7 shadow-xl shadow-neutral-900/5 backdrop-blur"
        style={{ animationDelay: "90ms" }}
      >
        <h1 className="text-xl font-bold">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {isSignup
            ? "This is your own saasevenly instance — free, unlimited, no card, no plan."
            : "Log in to your saasevenly dashboard."}
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          {isSignup && (
            <input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          )}
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <input
            type="password"
            required
            placeholder="Password (6+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          {error && (
            <p className="animate-fade-up rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-accent px-4 py-2.5 font-semibold text-white shadow-md shadow-accent/25 transition hover:-translate-y-0.5 hover:bg-accent-dark disabled:opacity-60"
          >
            {busy ? "Please wait…" : isSignup ? "Create account" : "Log in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-neutral-500">
          {isSignup ? (
            <>Already have an account? <Link href="/login" className="font-medium text-accent-dark underline">Log in</Link></>
          ) : (
            <>New here? <Link href="/signup" className="font-medium text-accent-dark underline">Create an account</Link></>
          )}
        </p>
      </div>
    </main>
  );
}
