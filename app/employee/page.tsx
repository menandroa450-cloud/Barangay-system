
"use client";
import { useRouter } from "next/navigation";

export default function EmployeePage() {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Employee Dashboard</h1>
      <ul>
        <li><a href="/">Attendance App (Main UI)</a></li>
      </ul>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
