"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) throw new Error(await res.text());
      setOk(true);
      setTimeout(() => (window.location.href = "/login"), 800);
    } catch (e: any) {
      setError(e.message || "Registration failed");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded">
      <h1 className="text-xl mb-4">Create an account</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <input type="text" placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} className="border rounded px-2 py-1" />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="border rounded px-2 py-1" />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="border rounded px-2 py-1" />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {ok && <div className="text-green-600 text-sm">Account created! Redirecting…</div>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Register</button>
        <a href="/login" className="text-sm underline">Already have an account? Sign in</a>
      </form>
    </div>
  );
}
