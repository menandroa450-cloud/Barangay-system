
"use client";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Admin Dashboard</h1>
      <p>Links:</p>
      <ul>
        <li><a href="/">Attendance App (Main UI)</a></li>
        <li><a href="/reports">Reports (PDF / Excel)</a></li>
      </ul>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
