
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error || "Login failed");
      return;
    }

    router.push(data.role === "admin" ? "/admin" : "/employee");
  };

  return (
    <div style={{ padding: 40, maxWidth: 420 }}>
      <h1>Login</h1>
      <p>Use demo accounts for capstone:</p>
      <ul>
        <li><b>admin</b> / admin123</li>
        <li><b>employee</b> / employee123</li>
      </ul>

      <form onSubmit={onSubmit}>
        <label>Username</label><br />
        <input value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} />
        <br /><br />
        <label>Password</label><br />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} />
        <br /><br />
        <button type="submit">Sign in</button>
      </form>

      {error ? <p style={{ color: "crimson", marginTop: 16 }}>{error}</p> : null}
    </div>
  );
}
