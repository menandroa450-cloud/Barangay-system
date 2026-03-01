
"use client";
import { useRouter } from "next/navigation";

export default function ReportsPage() {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Reports</h1>
      <p>Download attendance reports:</p>
      <ul>
        <li><a href="/api/reports/attendance.xlsx">Download Excel (.xlsx)</a></li>
        <li><a href="/api/reports/attendance.pdf">Download PDF (.pdf)</a></li>
      </ul>

      <p style={{ marginTop: 20 }}>
        <a href="/admin">Back to Admin</a>
      </p>

      <button onClick={logout}>Logout</button>
    </div>
  );
}
