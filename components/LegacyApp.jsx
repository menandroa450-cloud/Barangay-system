"use client";

// App.js
import React, { useEffect, useMemo, useState } from "react";


const numbersOnly = (v) => String(v || "").replace(/[^0-9]/g, "");

const PH_TZ = "Asia/Manila";
const PH_OFFSET_MS = 8 * 60 * 60 * 1000;

/* -------------------- TIME HELPERS -------------------- */
function formatPH(ms) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: PH_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date(ms));
}

function phYMD(ms) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PH_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date(ms))
    .reduce((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});
  return { y: Number(parts.year), m: Number(parts.month), d: Number(parts.day) };
}

function dateKeyPH(ms) {
  const { y, m, d } = phYMD(ms);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function monthKeyPH(ms) {
  const { y, m } = phYMD(ms);
  return `${y}-${String(m).padStart(2, "0")}`;
}

function phStartOfDayMs(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  return Date.UTC(y, m - 1, d, 0, 0, 0, 0) - PH_OFFSET_MS;
}
function phEndOfDayMs(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  return Date.UTC(y, m - 1, d, 23, 59, 59, 999) - PH_OFFSET_MS;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatHoursMinutes(ms) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
}

// Always 2 digits (00h 10m)
function formatHoursMinutes2(ms) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${pad2(h)}h ${pad2(m)}m`;
}

// hours + minutes + seconds (counting)
function formatHMS(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}h ${pad2(m)}m ${pad2(s)}s`;
}

function hoursFromMs(ms) {
  return ms / (1000 * 60 * 60);
}

/* -------------------- PER-EMPLOYEE SCHEDULE + LATE -------------------- */
function getScheduleHM(emp) {
  const t = String(emp?.scheduleTime || "").trim();
  const m = t.match(/^(\d{2}):(\d{2})$/);
  if (m) {
    const hour = Math.max(0, Math.min(23, Number(m[1])));
    const minute = Math.max(0, Math.min(59, Number(m[2])));
    return { hour, minute };
  }
  return { hour: 8, minute: 0 };
}

function scheduleUtcMsFor(timeInMs, emp) {
  const { y, m, d } = phYMD(timeInMs);
  const { hour, minute } = getScheduleHM(emp);
  return Date.UTC(y, m - 1, d, hour - 8, minute, 0, 0);
}

function lateInfo(timeInMs, emp) {
  const schedUtcMs = scheduleUtcMsFor(timeInMs, emp);
  const diff = timeInMs - schedUtcMs;
  if (diff > 0) return { statusText: `LATE (${formatHoursMinutes2(diff)})`, lateMs: diff };
  return { statusText: "ON-TIME", lateMs: 0 };
}

/* -------------------- INPUT -------------------- */
function TextInput(props) {
  return <input {...props} />;
}

/* -------------------- WRAPPERS OUTSIDE APP -------------------- */
const Shell = ({ children }) => (
  <div className="page">
    <div className="container">{children}</div>
  </div>
);

const TopBar = ({ user, menuOpen, setMenuOpen, openProfile, logout, fullNameOf }) => {
  const fullName = fullNameOf(user) || "NO NAME";
  const initials = (user?.firstName?.[0] || "U") + (user?.lastName?.[0] || "");

  return (
    <>
      {menuOpen && <div className="menuBackdrop" onClick={() => setMenuOpen(false)} />}
      <div className="topbar">
        <div className="brand">
          <div className="avatar topAvatar">
            {user?.photo ? (
              <img src={user.photo} alt="Profile" className="avatarImg" />
            ) : (
              <div className="avatarInitials">{initials.toUpperCase()}</div>
            )}
          </div>
          <div className="brandText">
            <div className="brandTitle">{fullName.toUpperCase()}</div>
            <div className="brandSub">
              {user?.role?.toUpperCase()} • ID: <b>{user?.id}</b>
            </div>
          </div>
        </div>

        <div className="accountWrap">
          <button type="button" className="chip" onClick={() => setMenuOpen((v) => !v)}>
            Account <span className="caret">▾</span>
          </button>

          {menuOpen && (
            <div className="menu">
              <button
                type="button"
                className="menuItem"
                onClick={() => {
                  openProfile();
                  setMenuOpen(false);
                }}
              >
                Edit Profile
              </button>
              <button type="button" className="menuItem danger" onClick={logout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const ProfileView = ({ editForm, setEditForm, user, saveProfile, setView, handlePhotoUpload }) => (
  <>
    <div className="sectionTitle">Edit Profile</div>

    <div className="grid2">
      {["firstName", "middleName", "lastName"].map((k) => (
        <div className="field" key={k}>
          <div className="label">
            {k === "firstName" ? "First Name" : k === "middleName" ? "Middle Name" : "Last Name"}
          </div>
          <TextInput value={editForm[k]} onChange={(e) => setEditForm({ ...editForm, [k]: e.target.value })} />
        </div>
      ))}

      <div className="field">
        <div className="label">Age</div>
        <TextInput
          value={String(editForm.age ?? "")}
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Age"
          onChange={(e) => setEditForm({ ...editForm, age: numbersOnly(e.target.value) })}
        />
      </div>

      <div className="field">
        <div className="label">Sex</div>
        <select value={editForm.sex} onChange={(e) => setEditForm({ ...editForm, sex: e.target.value })}>
          <option value="">Select Sex</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>

      <div className="field">
        <div className="label">Phone Number (11 digits)</div>
        <TextInput
          value={editForm.phone}
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="09XXXXXXXXX"
          onChange={(e) => setEditForm({ ...editForm, phone: numbersOnly(e.target.value).slice(0, 11) })}
        />
      </div>

      {user.role === "employee" && (
        <div className="field">
          <div className="label">Position</div>
          <TextInput value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} />
        </div>
      )}

      <div className="field">
        <div className="label">{user.role === "admin" ? "Admin" : "Employee"} Picture</div>
        <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e.target.files?.[0])} />
        <button className="btn ghost" type="button" onClick={() => setEditForm({ ...editForm, photo: "" })}>
          Remove Picture
        </button>

        <div className="mt10">
          {editForm.photo ? (
            <img
              src={editForm.photo}
              alt="Preview"
              className="preview120"
            />
          ) : (
            <div className="muted">No photo</div>
          )}
        </div>
      </div>
    </div>

    <div className="actionsRowWide">
      <button className="btn primary" onClick={saveProfile}>
        Save Profile
      </button>
      <button className="btn ghost" onClick={() => setView("attendance")}>
        Back
      </button>
    </div>
  </>
);

/* -------------------- APP -------------------- */
export default function App() {
  const [page, setPage] = useState("login"); // login | signup | employee | admin
  const [role, setRole] = useState("employee"); // employee | admin
  const [id, setId] = useState("");
  const [user, setUser] = useState(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState("attendance"); // attendance | profile

  // Admin UI
  const [adminTab, setAdminTab] = useState("folders"); // folders | employees | admins | trash
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [empSearch, setEmpSearch] = useState("");

  // Daily folders date search (DATE PICKER like your screenshot)
  const [folderDatePick, setFolderDatePick] = useState("");

  // Expand/collapse per folder
  const [collapsedDates, setCollapsedDates] = useState(() => new Set());

  // Admin filters
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [monthPick, setMonthPick] = useState("");

  // refresh usersMap after saving schedule
  const [storageTick, setStorageTick] = useState(0);

  // admin edits schedule time here
  const [empWorkTime, setEmpWorkTime] = useState("08:00");

  // Signup form
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    age: "",
    position: "",
    sex: "",
    phone: "",
    photo: "",
  });

  const [records, setRecords] = useState(JSON.parse(localStorage.getItem("records") || "[]"));

  // Trash (Undo)
  const [trashEmployees, setTrashEmployees] = useState(JSON.parse(localStorage.getItem("trash_employees") || "[]"));
  const [trashRecords, setTrashRecords] = useState(JSON.parse(localStorage.getItem("trash_records") || "[]"));
  const [trashAdmins, setTrashAdmins] = useState(JSON.parse(localStorage.getItem("trash_admins") || "[]"));

  const [editForm, setEditForm] = useState(null);

  useEffect(() => localStorage.setItem("records", JSON.stringify(records)), [records]);
  useEffect(() => localStorage.setItem("trash_employees", JSON.stringify(trashEmployees)), [trashEmployees]);
  useEffect(() => localStorage.setItem("trash_records", JSON.stringify(trashRecords)), [trashRecords]);
  useEffect(() => localStorage.setItem("trash_admins", JSON.stringify(trashAdmins)), [trashAdmins]);


  const fingerprint = () => window.confirm("Fingerprint verified (demo)");

  const fullNameOf = (u) => [u?.firstName, u?.middleName, u?.lastName].filter(Boolean).join(" ").trim();

  // Load users
  const usersMap = useMemo(() => {
    const map = new Map();
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith("employee_") || k.startsWith("admin_")) {
        try {
          const u = JSON.parse(localStorage.getItem(k));
          if (u?.id) map.set(u.role + "_" + u.id, u);
        } catch {}
      }
    }
    return map;
  }, [user, page, records, trashEmployees, trashRecords, trashAdmins, storageTick]);

  // always use latest saved user (so schedule updates apply without re-login)
  const currentUser = useMemo(() => {
    if (!user) return null;
    return usersMap.get(user.role + "_" + user.id) || user;
  }, [user, usersMap]);

  const allEmployees = useMemo(() => {
    const out = [];
    usersMap.forEach((u, key) => {
      if (key.startsWith("employee_")) out.push(u);
    });
    out.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    return out;
  }, [usersMap]);

  const allAdmins = useMemo(() => {
    const out = [];
    usersMap.forEach((u, key) => {
      if (key.startsWith("admin_")) out.push(u);
    });
    out.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    return out;
  }, [usersMap]);

  /* -------------------- OPTIONAL CLOUD SYNC (Backend + DB) --------------------
     - Does NOT change UI behavior.
     - If server is running, it mirrors localStorage -> SQLite DB via /api/sync.
     - If offline / error, it silently skips.
  */
  const lastSyncRef = React.useRef(0);

  useEffect(() => {
    const now = Date.now();
    if (now - lastSyncRef.current < 1200) return; // debounce
    lastSyncRef.current = now;

    const usersPayload = [
      ...allEmployees.map((e) => ({
        id: String(e.id || ""),
        role: "employee",
        firstName: e.firstName || "",
        middleName: e.middleName || null,
        lastName: e.lastName || "",
        age: e.age ? Number(e.age) : null,
        position: e.position || null,
        sex: e.sex || null,
        phone: e.phone || null,
        photo: e.photo || null,
        scheduleTime: e.scheduleTime || "08:00",
      })),
      ...allAdmins.map((a) => ({
        id: String(a.id || ""),
        role: "admin",
        firstName: a.firstName || "",
        middleName: a.middleName || null,
        lastName: a.lastName || "",
        age: a.age ? Number(a.age) : null,
        position: a.position || null,
        sex: a.sex || null,
        phone: a.phone || null,
        photo: a.photo || null,
        scheduleTime: a.scheduleTime || "08:00",
      })),
    ].filter((u) => u.id && u.firstName && u.lastName);

    const recordsPayload = (records || [])
      .map((r) => ({
        id: String(r.id || ""),
        role: r.role || "employee",
        timeIn: Number(r.timeIn),
        timeOut: r.timeOut ? Number(r.timeOut) : null,
      }))
      .filter((r) => r.id && Number.isFinite(r.timeIn));

    const controller = new AbortController();
    fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ users: usersPayload, records: recordsPayload }),
      signal: controller.signal,
    }).catch(() => {});

    return () => controller.abort();
  }, [records, allEmployees, allAdmins]);

  const filteredEmployees = useMemo(() => {
    const q = empSearch.trim().toLowerCase();
    if (!q) return allEmployees;
    return allEmployees.filter((emp) => {
      const name = fullNameOf(emp).toLowerCase();
      const empId = String(emp.id || "").toLowerCase();
      return name.includes(q) || empId.includes(q);
    });
  }, [allEmployees, empSearch]);

  const filteredAdmins = useMemo(() => {
    const q = empSearch.trim().toLowerCase();
    if (!q) return allAdmins;
    return allAdmins.filter((adm) => {
      const name = fullNameOf(adm).toLowerCase();
      const admId = String(adm.id || "").toLowerCase();
      return name.includes(q) || admId.includes(q);
    });
  }, [allAdmins, empSearch]);

  const employeeRecords = useMemo(() => records.filter((r) => r.role === "employee"), [records]);

  // any active record (for admin live counter)
  const hasAnyActiveRecord = useMemo(() => employeeRecords.some((r) => !r.timeOut), [employeeRecords]);

  // Admin daily folders (PH date)
  const dailyFolders = useMemo(() => {
    const map = new Map();
    for (const r of employeeRecords) {
      const k = dateKeyPH(r.timeIn);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(r);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => a.timeIn - b.timeIn);
      map.set(k, arr);
    }
    const dates = Array.from(map.keys()).sort((a, b) => (a < b ? 1 : -1));
    return { map, dates };
  }, [employeeRecords]);

  // Filter daily folders by date picker (exact date only)
  const filteredFolderDates = useMemo(() => {
    const q = String(folderDatePick || "").trim();
    if (!q) return dailyFolders.dates;
    return dailyFolders.dates.filter((d) => d === q);
  }, [dailyFolders.dates, folderDatePick]);

  const selectedEmployee = useMemo(() => {
    if (!selectedEmpId) return null;
    return usersMap.get("employee_" + selectedEmpId) || null;
  }, [selectedEmpId, usersMap]);

  // load selected employee schedule into time input
  useEffect(() => {
    if (!selectedEmployee) return;
    setEmpWorkTime(selectedEmployee.scheduleTime || "08:00");
  }, [selectedEmployee?.id]);

  const selectedEmployeeAttendanceAll = useMemo(() => {
    if (!selectedEmpId) return [];
    return employeeRecords
      .filter((r) => String(r.id) === String(selectedEmpId))
      .sort((a, b) => b.timeIn - a.timeIn);
  }, [selectedEmpId, employeeRecords]);

  const selectedEmployeeMonths = useMemo(() => {
    const set = new Set();
    for (const r of selectedEmployeeAttendanceAll) set.add(monthKeyPH(r.timeIn));
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [selectedEmployeeAttendanceAll]);

  const selectedEmployeeAttendanceFiltered = useMemo(() => {
    let logs = [...selectedEmployeeAttendanceAll];

    if (monthPick) logs = logs.filter((r) => monthKeyPH(r.timeIn) === monthPick);

    const fromMs = phStartOfDayMs(filterFrom);
    const toMs = phEndOfDayMs(filterTo);
    if (fromMs != null) logs = logs.filter((r) => r.timeIn >= fromMs);
    if (toMs !=null) logs = logs.filter((r) => r.timeIn <= toMs);

    return logs;
  }, [selectedEmployeeAttendanceAll, filterFrom, filterTo, monthPick]);

  const selectedEmployeeDailyBreakdown = useMemo(() => {
    const map = new Map();
    for (const r of selectedEmployeeAttendanceFiltered) {
      const k = dateKeyPH(r.timeIn);
      if (!r.timeOut) continue;
      const dur = Math.max(0, r.timeOut - r.timeIn);
      if (!map.has(k)) map.set(k, { totalMs: 0, logs: [] });
      const obj = map.get(k);
      obj.totalMs += dur;
      obj.logs.push(r);
    }
    const dates = Array.from(map.keys()).sort((a, b) => (a < b ? 1 : -1));
    return { map, dates };
  }, [selectedEmployeeAttendanceFiltered]);

  const selectedEmployeeTotals = useMemo(() => {
    const daySet = new Set();
    let totalMs = 0;
    for (const r of selectedEmployeeAttendanceFiltered) {
      daySet.add(dateKeyPH(r.timeIn));
      if (r.timeOut) totalMs += Math.max(0, r.timeOut - r.timeIn);
    }
    return { daysPresent: daySet.size, totalMs, totalHours: hoursFromMs(totalMs) };
  }, [selectedEmployeeAttendanceFiltered]);

  const myRecords = useMemo(() => {
    if (!currentUser) return [];
    return records
      .filter((r) => r.id === currentUser.id && r.role === currentUser.role)
      .sort((a, b) => b.timeIn - a.timeIn);
  }, [records, currentUser]);

  const myActiveSession = useMemo(() => {
    if (!currentUser) return null;
    const mine = records
      .filter((r) => r.role === currentUser.role && String(r.id) === String(currentUser.id))
      .sort((a, b) => b.timeIn - a.timeIn);
    if (mine[0] && !mine[0].timeOut) return mine[0];
    return null;
  }, [records, currentUser]);

  /* TIMER: Employee active OR Admin folders active */
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const shouldRun =
      (page === "employee" && view === "attendance" && !!myActiveSession) ||
      (page === "admin" && adminTab === "folders" && hasAnyActiveRecord);

    if (!shouldRun) return;

    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [page, view, myActiveSession?.timeIn, adminTab, hasAnyActiveRecord]);

  const myActiveDurationText = useMemo(() => {
    if (!myActiveSession) return "";
    const durMs = Math.max(0, now - myActiveSession.timeIn);
    return formatHMS(durMs);
  }, [myActiveSession, now]);

  const miniBtn = {
    width: 26,
    height: 26,
    minWidth: 26,
    borderRadius: 8,
    padding: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    lineHeight: 1,
  };

  // small centered action buttons (collapse/expand + print)
  const smallActionBtnStyle = {
    height: 38,
    padding: "0 14px",
    borderRadius: 12,
    minWidth: 120,
    maxWidth: 180,
  };

  const toggleFolder = (date) => {
    setCollapsedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  /* -------------------- DELETE / RESTORE -------------------- */
  const adminDeleteEmployeeAccount = (empIdToDelete) => {
    if (currentUser?.role !== "admin") return;
    const ok = window.confirm("Delete this employee account? (Can restore in Trash)");
    if (!ok) return;

    const emp = usersMap.get("employee_" + empIdToDelete);
    if (emp) setTrashEmployees((prev) => [{ deletedAt: Date.now(), payload: emp }, ...prev]);

    localStorage.removeItem("employee_" + empIdToDelete);

    const empRecs = records.filter((r) => r.role === "employee" && String(r.id) === String(empIdToDelete));
    if (empRecs.length) {
      setTrashRecords((prev) => [
        { deletedAt: Date.now(), type: "employeeRecords", empId: String(empIdToDelete), payload: empRecs },
        ...prev,
      ]);
    }

    setRecords((prev) => prev.filter((r) => !(r.role === "employee" && String(r.id) === String(empIdToDelete))));

    if (String(selectedEmpId) === String(empIdToDelete)) setSelectedEmpId("");
  };

  const adminDeleteOneRecord = (rec) => {
    if (currentUser?.role !== "admin") return;
    const ok = window.confirm("Delete this attendance record? (Can restore in Trash)");
    if (!ok) return;

    setTrashRecords((prev) => [{ deletedAt: Date.now(), type: "record", payload: rec }, ...prev]);

    setRecords((prev) =>
      prev.filter(
        (r) =>
          !(
            r.role === rec.role &&
            String(r.id) === String(rec.id) &&
            r.timeIn === rec.timeIn &&
            r.timeOut === rec.timeOut
          )
      )
    );
  };

  const adminDeleteAdminAccount = (adminIdToDelete) => {
    if (currentUser?.role !== "admin") return;
    const ok = window.confirm("Delete this admin account? (Can restore in Trash)");
    if (!ok) return;

    const adm = usersMap.get("admin_" + adminIdToDelete);
    if (adm) setTrashAdmins((prev) => [{ deletedAt: Date.now(), payload: adm }, ...prev]);

    localStorage.removeItem("admin_" + adminIdToDelete);
    alert("Admin account deleted (moved to Trash).");
  };

  const restoreTrashEmployee = (trashItem) => {
    if (currentUser?.role !== "admin") return;
    const emp = trashItem?.payload;
    if (!emp?.id) return;

    localStorage.setItem("employee_" + emp.id, JSON.stringify(emp));
    setTrashEmployees((prev) => prev.filter((x) => x !== trashItem));
    setStorageTick((t) => t + 1);
    alert("Employee restored!");
  };

  const restoreTrashAdmin = (trashItem) => {
    if (currentUser?.role !== "admin") return;
    const adm = trashItem?.payload;
    if (!adm?.id) return;

    localStorage.setItem("admin_" + adm.id, JSON.stringify(adm));
    setTrashAdmins((prev) => prev.filter((x) => x !== trashItem));
    setStorageTick((t) => t + 1);
    alert("Admin restored!");
  };

  const restoreTrashRecordItem = (trashItem) => {
    if (currentUser?.role !== "admin") return;

    if (trashItem.type === "record") {
      setRecords((prev) => [trashItem.payload, ...prev]);
      setTrashRecords((prev) => prev.filter((x) => x !== trashItem));
      alert("Record restored!");
      return;
    }

    if (trashItem.type === "employeeRecords" && Array.isArray(trashItem.payload)) {
      setRecords((prev) => [...trashItem.payload, ...prev]);
      setTrashRecords((prev) => prev.filter((x) => x !== trashItem));
      alert("Employee records restored!");
      return;
    }
  };

  const clearTrash = () => {
    if (currentUser?.role !== "admin") return;
    const ok = window.confirm("Permanently clear Trash? This cannot be undone.");
    if (!ok) return;
    setTrashEmployees([]);
    setTrashRecords([]);
    setTrashAdmins([]);
  };

  /* -------------------- ADMIN: SAVE EMPLOYEE SCHEDULE -------------------- */
  const adminSaveEmployeeSchedule = () => {
    if (currentUser?.role !== "admin") return;
    if (!selectedEmployee) return;

    const m = String(empWorkTime || "").match(/^(\d{2}):(\d{2})$/);
    if (!m) return alert("Invalid time. Use HH:MM (example 10:00).");

    const updated = { ...selectedEmployee, scheduleTime: empWorkTime };
    localStorage.setItem("employee_" + updated.id, JSON.stringify(updated));

    setStorageTick((t) => t + 1);
    alert("Work schedule saved!");
  };

  /* -------------------- PDF PRINT (PER EMPLOYEE) -------------------- */
  const printEmployeePdf = () => {
    if (!selectedEmployee) return alert("Select an employee first.");

    const emp = selectedEmployee;
    const logs = selectedEmployeeAttendanceFiltered;

    const rangeText =
      monthPick ? `Month: ${monthPick}` : filterFrom || filterTo ? `Date Range: ${filterFrom || "—"} to ${filterTo || "—"}` : "All Records";

    const sched = getScheduleHM(emp);
    const schedText = `${pad2(sched.hour)}:${pad2(sched.minute)}`;

    const rows = logs
      .map((r, idx) => {
        const ti = formatPH(r.timeIn);
        const to = r.timeOut ? formatPH(r.timeOut) : "Active";
        const date = dateKeyPH(r.timeIn);
        const status = lateInfo(r.timeIn, emp).statusText;

        const durMs = r.timeOut ? Math.max(0, r.timeOut - r.timeIn) : 0;
        const hm = r.timeOut ? formatHoursMinutes(durMs) : "-";

        return `
          <tr>
            <td>${idx + 1}</td>
            <td>${date}</td>
            <td>${status}</td>
            <td>${ti}</td>
            <td>${to}</td>
            <td>${hm}</td>
          </tr>
        `;
      })
      .join("");

    const breakdownRows = selectedEmployeeDailyBreakdown.dates
      .map((d) => {
        const totalMs = selectedEmployeeDailyBreakdown.map.get(d).totalMs;
        return `<tr><td>${d}</td><td>${formatHoursMinutes(totalMs)}</td></tr>`;
      })
      .join("");

    const html = `
      <html>
        <head>
          <title>Attendance Report - ${emp.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin: 0 0 6px; }
            .muted { color: #444; margin-bottom: 16px; }
            .box { border: 1px solid #ddd; padding: 14px; border-radius: 10px; margin-bottom: 18px;}
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 10px; font-size: 12px; }
            th { background: #f3f4f6; text-align: left; }
            .row { margin: 4px 0; }
            .summary { margin-top: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Attendance Report</h1>
          <div class="muted">${rangeText}</div>

          <div class="box">
            <div class="row"><b>Full Name:</b> ${fullNameOf(emp)}</div>
            <div class="row"><b>Employee ID:</b> ${emp.id}</div>
            <div class="row"><b>Start Work Time:</b> ${schedText}</div>
            <div class="row"><b>Age:</b> ${emp.age || "-"}</div>
            <div class="row"><b>Sex:</b> ${emp.sex || "-"}</div>
            <div class="row"><b>Phone:</b> ${emp.phone || "-"}</div>
            <div class="row"><b>Position:</b> ${emp.position || "-"}</div>

            <div class="summary">Total Days Present: ${selectedEmployeeTotals.daysPresent}</div>
            <div class="summary">Total Hours: ${selectedEmployeeTotals.totalHours.toFixed(2)} hrs</div>
          </div>

          <h3>Per Record</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Status</th>
                <th>Time In (PH)</th>
                <th>Time Out (PH)</th>
                <th>Total (h m)</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="6">No attendance records.</td></tr>`}
            </tbody>
          </table>

          <h3 style="margin-top:18px;">Total Hours Per Day (Finished only)</h3>
          <table>
            <thead>
              <tr><th>Date</th><th>Total Hours</th></tr>
            </thead>
            <tbody>
              ${breakdownRows || `<tr><td colspan="2">No daily totals.</td></tr>`}
            </tbody>
          </table>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    const w = window.open("", "_blank");
    if (!w) return alert("Popup blocked. Allow popups then try again.");
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  /* -------------------- PDF PRINT (DAILY FOLDER - ALL EMPLOYEES) -------------------- */
  const printDailyFolderPdf = (date, dayLogs) => {
    const safeDate = String(date || "");

    const totalEmployees = dayLogs.length;
    const finishedCount = dayLogs.filter((r) => !!r.timeOut).length;
    const activeCount = totalEmployees - finishedCount;

    const rows = dayLogs
      .map((r, idx) => {
        const emp = usersMap.get("employee_" + r.id) || null;

        const name = emp ? fullNameOf(emp) : "UNKNOWN";
        const sex = emp?.sex || "-";
        const phone = emp?.phone || "-";
        const position = emp?.position || "-";

        const status = lateInfo(r.timeIn, emp).statusText;

        const ti = formatPH(r.timeIn);
        const to = r.timeOut ? formatPH(r.timeOut) : "Active";

        const finished = !!r.timeOut;
        const durMs = finished ? Math.max(0, r.timeOut - r.timeIn) : Math.max(0, now - r.timeIn);
        const totalText = finished
          ? `${formatHoursMinutes(durMs)} (${hoursFromMs(durMs).toFixed(2)} hrs)`
          : `${formatHMS(durMs)} (ACTIVE)`;

        return `
          <tr>
            <td>${idx + 1}</td>
            <td>${name}</td>
            <td>${r.id}</td>
            <td>${sex}</td>
            <td>${phone}</td>
            <td>${position}</td>
            <td>${status}</td>
            <td>${ti}</td>
            <td>${to}</td>
            <td>${totalText}</td>
          </tr>
        `;
      })
      .join("");

    const html = `
      <html>
        <head>
          <title>Daily Attendance - ${safeDate}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin: 0 0 6px; }
            .muted { color: #444; margin-bottom: 16px; }
            .box { border: 1px solid #ddd; padding: 14px; border-radius: 10px; margin-bottom: 18px;}
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 10px; font-size: 11px; vertical-align: top; }
            th { background: #f3f4f6; text-align: left; }
            .row { margin: 4px 0; }
            .summary { margin-top: 8px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Daily Attendance Report</h1>
          <div class="muted">Date (PH): ${safeDate}</div>

          <div class="box">
            <div class="row"><b>Total Records:</b> ${totalEmployees}</div>
            <div class="row"><b>Finished:</b> ${finishedCount}</div>
            <div class="row"><b>Active:</b> ${activeCount}</div>
            <div class="summary">Generated: ${formatPH(Date.now())}</div>
          </div>

          <h3>All Employees (Time In / Time Out)</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Employee Name</th>
                <th>Employee ID</th>
                <th>Sex</th>
                <th>Phone</th>
                <th>Position</th>
                <th>Status</th>
                <th>Time In (PH)</th>
                <th>Time Out (PH)</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="10">No attendance records.</td></tr>`}
            </tbody>
          </table>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    const w = window.open("", "_blank");
    if (!w) return alert("Popup blocked. Allow popups then try again.");
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  /* -------------------- PHOTO UPLOAD -------------------- */
  const handlePhotoUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Please select an image file.");

    const MAX = 240;
    try {
      const bitmap = await createImageBitmap(file);
      const ratio = Math.min(MAX / bitmap.width, MAX / bitmap.height, 1);
      const w = Math.max(1, Math.round(bitmap.width * ratio));
      const h = Math.max(1, Math.round(bitmap.height * ratio));

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      ctx.drawImage(bitmap, 0, 0, w, h);

      const compressed = canvas.toDataURL("image/jpeg", 0.78);
      setEditForm((p) => ({ ...(p || {}), photo: compressed }));
    } catch {
      const reader = new FileReader();
      reader.onload = () => setEditForm((p) => ({ ...(p || {}), photo: String(reader.result || "") }));
      reader.readAsDataURL(file);
    }
  };

  /* -------------------- AUTH -------------------- */
  const signup = () => {
    if (!id.trim()) return alert("ID required");
    if (!/^\d+$/.test(id)) return alert("ID must contain numbers only.");
    if (!fingerprint()) return;

    if (!form.firstName.trim() || !form.lastName.trim() || !String(form.age).trim() || !form.sex.trim() || !form.phone.trim()) {
      return alert("Please fill First Name, Last Name, Age, Sex, and Phone Number.");
    }
    if (form.phone.length !== 11) return alert("Phone number must be exactly 11 digits.");
    if (role === "employee" && !form.position.trim()) return alert("Position is required for employee.");

    const scheduleTime = role === "employee" ? "08:00" : "";
    const data = { id: id.trim(), role, ...form, scheduleTime };

    localStorage.setItem(role + "_" + data.id, JSON.stringify(data));
    setUser(data);
    setPage(role);
    setView("attendance");
    setMenuOpen(false);

    setAdminTab("folders");
    setSelectedEmpId("");
    setEmpSearch("");
    setFilterFrom("");
    setFilterTo("");
    setMonthPick("");
    setFolderDatePick("");
    setCollapsedDates(new Set());
  };

  const login = () => {
    if (!id.trim()) return alert("ID required");
    if (!/^\d+$/.test(id)) return alert("ID must contain numbers only.");
    if (!fingerprint()) return;

    const data = localStorage.getItem(role + "_" + id.trim());
    if (!data) return alert("Account not found. Please sign up first.");

    const u = JSON.parse(data);
    setUser(u);
    setPage(role);
    setView("attendance");
    setMenuOpen(false);

    setAdminTab("folders");
    setSelectedEmpId("");
    setEmpSearch("");
    setFilterFrom("");
    setFilterTo("");
    setMonthPick("");
    setFolderDatePick("");
    setCollapsedDates(new Set());
  };

  const logout = () => {
    setMenuOpen(false);
    setUser(null);
    setId("");
    setRole("employee");
    setPage("login");
    setView("attendance");
    setEditForm(null);

    setAdminTab("folders");
    setSelectedEmpId("");
    setEmpSearch("");
    setFilterFrom("");
    setFilterTo("");
    setMonthPick("");
    setFolderDatePick("");
    setCollapsedDates(new Set());
  };

  const openProfile = () => {
    if (!currentUser) return;
    setEditForm({
      firstName: currentUser.firstName || "",
      middleName: currentUser.middleName || "",
      lastName: currentUser.lastName || "",
      age: currentUser.age || "",
      position: currentUser.position || "",
      sex: currentUser.sex || "",
      phone: currentUser.phone || "",
      photo: currentUser.photo || "",
      scheduleTime: currentUser.scheduleTime || "08:00",
    });
    setView("profile");
  };

  const saveProfile = () => {
    if (!editForm || !currentUser) return;

    if (!editForm.firstName.trim() || !editForm.lastName.trim() || !String(editForm.age).trim() || !editForm.sex.trim() || !editForm.phone.trim()) {
      return alert("First Name, Last Name, Age, Sex and Phone are required.");
    }
    if (editForm.phone.length !== 11) return alert("Phone number must be exactly 11 digits.");
    if (currentUser.role === "employee" && !editForm.position.trim()) return alert("Position is required for employee.");

    const updated = { ...currentUser, ...editForm, scheduleTime: currentUser.scheduleTime || editForm.scheduleTime || "08:00" };
    setUser(updated);
    localStorage.setItem(updated.role + "_" + updated.id, JSON.stringify(updated));
    setStorageTick((t) => t + 1);
    alert("Profile saved!");
  };

  /* -------------------- ATTENDANCE -------------------- */
  const timeIn = () => {
    if (!currentUser || currentUser.role !== "employee") return;
    const ok = window.confirm("Are you sure that you time in?");
    if (!ok) return;

    const mine = records
      .filter((r) => r.role === "employee" && r.id === currentUser.id)
      .sort((a, b) => b.timeIn - a.timeIn);

    if (mine[0] && !mine[0].timeOut) return alert("You already have an active Time In.");

    setRecords([...records, { id: currentUser.id, role: currentUser.role, timeIn: Date.now(), timeOut: null }]);
  };

  const timeOut = () => {
    if (!currentUser || currentUser.role !== "employee") return;
    const ok = window.confirm("Are you sure that you time out?");
    if (!ok) return;

    let updatedOne = false;
    const updated = [...records]
      .reverse()
      .map((r) => {
        if (!updatedOne && r.id === currentUser.id && r.role === currentUser.role && !r.timeOut) {
          updatedOne = true;
          return { ...r, timeOut: Date.now() };
        }
        return r;
      })
      .reverse();

    if (!updatedOne) return alert("No active Time In found.");
    setRecords(updated);
  };

  /* -------------------- LOGIN UI -------------------- */
  if (page === "login")
    return (
      <div className="authShell">
        <div className="authGrid">
          <div className="authVisual">
            <div className="authBrand">
              <div className="kicker">BARANGAY ATTENDANCE SYSTEM</div>
              <div className="name">Barangay E. Rodriguez</div>
              <div className="desc">Secure Sign in • Fingerprint demo.</div>
            </div>
            <div className="holo">
              <div className="ring" />
              <div className="shield" />
            </div>
          </div>

          <div className="authCard">
            <div className="authHeader">
              <div className="bigTitle">Barangay E. Rodriguez</div>
              <div className="muted">Please sign in with your Employee/Admin ID and fingerprint (demo)</div>
            </div>

            <div className="field">
              <div className="label">Role</div>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="field">
              <div className="label">{role === "employee" ? "Employee ID" : "Admin ID"}</div>
              <TextInput value={id} inputMode="numeric" pattern="[0-9]*" placeholder="Enter numeric ID" onChange={(e) => setId(numbersOnly(e.target.value))} />
            </div>

            <button className="btn primary" onClick={login}>
              Fingerprint Login
            </button>
            <button className="btn ghost" onClick={() => setPage("signup")}>
              Create {role === "employee" ? "Employee" : "Admin"} Account
            </button>
          </div>
        </div>
      </div>
    );

  /* -------------------- SIGNUP UI -------------------- */
  if (page === "signup")
    return (
      <div className="authShell">
        <div className="authGrid">
          <div className="authVisual">
            <div className="authBrand">
              <div className="kicker">BARANGAY ATTENDANCE SYSTEM</div>
              <div className="name">Barangay E. Rodriguez</div>
              <div className="desc">Secure Sign up registration • Fingerprint demo.</div>
            </div>
            <div className="holo">
              <div className="ring" />
              <div className="shield" />
            </div>
          </div>

          <div className="authCard">
            <div className="authHeader">
              <div className="bigTitle">Barangay E. Rodriguez • {role === "employee" ? "Employee" : "Admin"} Sign Up</div>
              <div className="muted">Please sign up with your Employee/Admin ID and fingerprint (demo)</div>
            </div>

            <div className="grid2">
              <div className="field">
                <div className="label">ID (numbers only)</div>
                <TextInput value={id} inputMode="numeric" pattern="[0-9]*" placeholder="Enter numeric ID" onChange={(e) => setId(numbersOnly(e.target.value))} />
              </div>

              <div className="field">
                <div className="label">First Name</div>
                <TextInput value={form.firstName} placeholder="First Name" onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>

              <div className="field">
                <div className="label">Middle Name</div>
                <TextInput value={form.middleName} placeholder="Middle Name" onChange={(e) => setForm({ ...form, middleName: e.target.value })} />
              </div>

              <div className="field">
                <div className="label">Last Name</div>
                <TextInput value={form.lastName} placeholder="Last Name" onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>

              <div className="field">
                <div className="label">Age</div>
                <TextInput value={String(form.age ?? "")} inputMode="numeric" pattern="[0-9]*" placeholder="Age" onChange={(e) => setForm({ ...form, age: numbersOnly(e.target.value) })} />
              </div>

              <div className="field">
                <div className="label">Sex</div>
                <select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
                  <option value="">Select Sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="field">
                <div className="label">Phone Number (11 digits)</div>
                <TextInput value={form.phone} inputMode="numeric" pattern="[0-9]*" placeholder="09XXXXXXXXX" onChange={(e) => setForm({ ...form, phone: numbersOnly(e.target.value).slice(0, 11) })} />
              </div>

              {role === "employee" && (
                <div className="field">
                  <div className="label">Position</div>
                  <TextInput value={form.position} placeholder="Position" onChange={(e) => setForm({ ...form, position: e.target.value })} />
                </div>
              )}
            </div>

            <button className="btn primary" onClick={signup}>
              Create Account
            </button>
            <button className="btn ghost" onClick={() => setPage("login")}>
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );

  /* -------------------- EMPLOYEE PAGE -------------------- */
  if (page === "employee")
    return (
      <Shell>
        <div className="dash">
          <TopBar user={currentUser} menuOpen={menuOpen} setMenuOpen={setMenuOpen} openProfile={openProfile} logout={logout} fullNameOf={fullNameOf} />

          <div className="contentCard mt12">
            {view === "profile" && editForm ? (
              <ProfileView editForm={editForm} setEditForm={setEditForm} user={currentUser} saveProfile={saveProfile} setView={setView} handlePhotoUpload={handlePhotoUpload} />
            ) : (
              <>
                <div className="sectionTitle">Attendance</div>

                <div className="actionsRow">
                  <button className="btn primary" onClick={timeIn}>
                    Time In
                  </button>
                  <button className="btn danger" onClick={timeOut}>
                    Time Out
                  </button>
                </div>

                {myActiveSession ? (
                  <div className="item mt10">
                    <div>
                      <b>Active Time In:</b> {formatPH(myActiveSession.timeIn)}
                    </div>
                    <div>
                      <b>Counting:</b> {myActiveDurationText}
                    </div>
                  </div>
                ) : (
                  <div className="muted mt10">
                    No active session.
                  </div>
                )}

                <div className="tableTitle">My Records</div>
                {myRecords.length === 0 ? (
                  <div className="muted">No attendance record yet.</div>
                ) : (
                  <div className="list">
                    {myRecords.map((r, i) => {
                      const finished = !!r.timeOut;
                      const durMs = finished ? Math.max(0, r.timeOut - r.timeIn) : 0;
                      const status = lateInfo(r.timeIn, currentUser).statusText;

                      return (
                        <div key={i} className="item">
                          <div>
                            <b>Date (PH):</b> {dateKeyPH(r.timeIn)}
                          </div>
                          <div>
                            <b>Status:</b> {status}
                          </div>
                          <div>
                            <b>Time In (PH):</b> {formatPH(r.timeIn)}
                          </div>
                          <div>
                            <b>Time Out (PH):</b> {r.timeOut ? formatPH(r.timeOut) : "Active"}
                          </div>
                          <div>
                            <b>Total:</b>{" "}
                            {finished ? `${formatHoursMinutes(durMs)} (${hoursFromMs(durMs).toFixed(2)} hrs)` : "-"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Shell>
    );

  /* -------------------- ADMIN PAGE -------------------- */
  if (page === "admin")
    return (
      <Shell>
        <div className="dash">
          <TopBar user={currentUser} menuOpen={menuOpen} setMenuOpen={setMenuOpen} openProfile={openProfile} logout={logout} fullNameOf={fullNameOf} />

          <div className="contentCard mt12">
            {view === "profile" && editForm ? (
              <ProfileView editForm={editForm} setEditForm={setEditForm} user={currentUser} saveProfile={saveProfile} setView={setView} handlePhotoUpload={handlePhotoUpload} />
            ) : (
              <>
                {/*NAV BUTTONS. If small screen, it scrolls horizontally. */}
                <div className="adminNavRow">
                  <button className={`btn ghost ${adminTab === "folders" ? "activeTab" : ""}`} onClick={() => { setAdminTab("folders"); setSelectedEmpId(""); }}>
                    Attendance Records
                  </button>
                  <button className={`btn ghost ${adminTab === "employees" ? "activeTab" : ""}`} onClick={() => { setAdminTab("employees"); setSelectedEmpId(""); }}>
                    Employee Accounts
                  </button>
                  <button className={`btn ghost ${adminTab === "admins" ? "activeTab" : ""}`} onClick={() => { setAdminTab("admins"); setSelectedEmpId(""); }}>
                    Admin Accounts
                  </button>
                  <button className={`btn ghost ${adminTab === "trash" ? "activeTab" : ""}`} onClick={() => { setAdminTab("trash"); setSelectedEmpId(""); }}>
                    Trash
                  </button>
                </div>

                {/* ---------------- TRASH ---------------- */}
                {adminTab === "trash" && (
                  <>
                    <div className="sectionTitle">Trash (Undo Delete)</div>
                    <div className="actionsRow mt10">
                      <button className="btn danger" onClick={clearTrash}>
                        Clear Trash Permanently
                      </button>
                    </div>

                    <div className="tableTitle">Deleted Admins</div>
                    {trashAdmins.length === 0 ? (
                      <div className="muted">No deleted admins.</div>
                    ) : (
                      <div className="list">
                        {trashAdmins.map((t, i) => (
                          <div key={i} className="item flexBetweenGap12">
                            <div className="flex1">
                              <div>
                                <b>Deleted At (PH):</b> {formatPH(t.deletedAt)}
                              </div>
                              <div>
                                <b>Admin:</b> {fullNameOf(t.payload)} • ID: {t.payload?.id}
                              </div>
                            </div>
                            <button className="btn primary" style={miniBtn} title="Restore" onClick={() => restoreTrashAdmin(t)}>
                              ↺
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="tableTitle">Deleted Employees</div>
                    {trashEmployees.length === 0 ? (
                      <div className="muted">No deleted employees.</div>
                    ) : (
                      <div className="list">
                        {trashEmployees.map((t, i) => (
                          <div key={i} className="item flexBetweenGap12">
                            <div className="flex1">
                              <div>
                                <b>Deleted At (PH):</b> {formatPH(t.deletedAt)}
                              </div>
                              <div>
                                <b>Employee:</b> {fullNameOf(t.payload)} • ID: {t.payload?.id}
                              </div>
                            </div>
                            <button className="btn primary" style={miniBtn} title="Restore" onClick={() => restoreTrashEmployee(t)}>
                              ↺
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="tableTitle">Deleted Records</div>
                    {trashRecords.length === 0 ? (
                      <div className="muted">No deleted records.</div>
                    ) : (
                      <div className="list">
                        {trashRecords.map((t, i) => (
                          <div key={i} className="item flexBetweenGap12">
                            <div className="flex1">
                              <div>
                                <b>Deleted At (PH):</b> {formatPH(t.deletedAt)}
                              </div>
                              <div>
                                <b>Type:</b> {t.type}
                              </div>
                            </div>
                            <button className="btn primary" style={miniBtn} title="Restore" onClick={() => restoreTrashRecordItem(t)}>
                              ↺
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* ---------------- ADMINS ---------------- */}
                {adminTab === "admins" && (
                  <>
                    <div className="sectionTitle">All Admin Accounts</div>

                    <div className="field mt8">
                      <div className="label">Search (Admin ID / Full Name)</div>
                      <TextInput value={empSearch} placeholder="Type ID or name..." onChange={(e) => setEmpSearch(e.target.value)} />
                    </div>

                    {filteredAdmins.length === 0 ? (
                      <div className="muted">No matching admins.</div>
                    ) : (
                      <div className="list">
                        {filteredAdmins.map((adm) => (
                          <div key={adm.id} className="item">
                            <div className="flexBetweenGap12">
                              <div className="rowGap12CenterFlex1">
                                <div className="avatar avatar52">
                                  {adm.photo ? (
                                    <img src={adm.photo} alt="admin" className="avatarImg" />
                                  ) : (
                                    <div className="avatarInitials">
                                      {(adm.firstName?.[0] || "A").toUpperCase()}
                                      {(adm.lastName?.[0] || "").toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="fw900">{fullNameOf(adm)}</div>
                                  <div className="muted">ADMIN • ID: {adm.id}</div>
                                </div>
                              </div>

                              <button className="btn danger" style={miniBtn} title="Delete Admin Account" onClick={() => adminDeleteAdminAccount(adm.id)}>
                                −
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* ---------------- EMPLOYEES ---------------- */}
                {adminTab === "employees" && (
                  <>
                    <div className="sectionTitle">All Employee Accounts</div>

                    <div className="field mt8">
                      <div className="label">Search (Employee ID / Full Name)</div>
                      <TextInput value={empSearch} placeholder="Type ID or name..." onChange={(e) => setEmpSearch(e.target.value)} />
                    </div>

                    {filteredEmployees.length === 0 ? (
                      <div className="muted">No matching employees.</div>
                    ) : (
                      <div className="list">
                        {filteredEmployees.map((emp) => (
                          <div key={emp.id} className="item">
                            <div className="flexBetweenGap12">
                              <div
                                className="cursorPointerFlex1"
                                onClick={() => {
                                  setSelectedEmpId(emp.id);
                                  setFilterFrom("");
                                  setFilterTo("");
                                  setMonthPick("");
                                }}
                              >
                                <div className="rowGap12Center">
                                  <div className="avatar avatar52">
                                    {emp.photo ? (
                                      <img src={emp.photo} alt="emp" className="avatarImg" />
                                    ) : (
                                      <div className="avatarInitials">
                                        {(emp.firstName?.[0] || "E").toUpperCase()}
                                        {(emp.lastName?.[0] || "").toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="fw900">{fullNameOf(emp)}</div>
                                    <div className="muted">EMPLOYEE • ID: {emp.id}</div>
                                  </div>
                                </div>

                                <div className="mt10">
                                  <div>
                                    <b>Age:</b> {emp.age || "-"}
                                  </div>
                                  <div>
                                    <b>Sex:</b> {emp.sex || "-"}
                                  </div>
                                  <div>
                                    <b>Phone:</b> {emp.phone || "-"}
                                  </div>
                                  <div>
                                    <b>Position:</b> {emp.position || "-"}
                                  </div>
                                </div>
                              </div>

                              <button className="btn danger" style={miniBtn} title="Delete Account" onClick={() => adminDeleteEmployeeAccount(emp.id)}>
                                −
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ===== Selected Employee Preview + Schedule + PDF ===== */}
                    {selectedEmpId && selectedEmployee && (
                      <>
                        <div className="sectionTitle mt16">
                          Selected Employee Details
                        </div>

                        <div className="item mt10">
                          <div className="rowGap14Center">
                            <div className="avatar avatar70">
                              {selectedEmployee.photo ? (
                                <img src={selectedEmployee.photo} alt="emp" className="avatarImg" />
                              ) : (
                                <div className="avatarInitials fs18">
                                  {(selectedEmployee.firstName?.[0] || "E").toUpperCase()}
                                  {(selectedEmployee.lastName?.[0] || "").toUpperCase()}
                                </div>
                              )}
                            </div>

                            <div className="flex1">
                              <div className="fw900 fs18">{fullNameOf(selectedEmployee)}</div>
                              <div className="muted">
                                EMPLOYEE • ID: <b>{selectedEmployee.id}</b>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="sectionTitle mt16">
                          Work Schedule
                        </div>
                        <div className="item mt10">
                          <div className="rowGap12CenterWrap">
                            <div className="minW200">
                              <b>Start Work Time:</b>
                            </div>

                            <input type="time" value={empWorkTime} onChange={(e) => setEmpWorkTime(e.target.value)} className="pad8Radius10" />

                            <button className="btn primary" type="button" onClick={adminSaveEmployeeSchedule}>
                              Save Schedule
                            </button>
                          </div>
                        </div>

                        <div className="sectionTitle mt16">
                          Employee Attendance (Preview + PDF)
                        </div>

                        <div className="grid2 mt12">
                          <div className="field">
                            <div className="label">Month (optional)</div>
                            <select value={monthPick} onChange={(e) => setMonthPick(e.target.value)}>
                              <option value="">All months</option>
                              {selectedEmployeeMonths.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="field">
                            <div className="label">From (optional)</div>
                            <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
                          </div>

                          <div className="field">
                            <div className="label">To (optional)</div>
                            <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
                          </div>

                          <div className="field">
                            <div className="label">Actions</div>
                            <button className="btn ghost" type="button" onClick={() => { setMonthPick(""); setFilterFrom(""); setFilterTo(""); }}>
                              Clear Filters
                            </button>
                          </div>
                        </div>

                        <div className="item mt10">
                          <div>
                            <b>Total Days Present:</b> {selectedEmployeeTotals.daysPresent}
                          </div>
                          <div>
                            <b>Total Hours (finished only):</b> {selectedEmployeeTotals.totalHours.toFixed(2)} hrs
                          </div>
                        </div>

                        <div className="actionsRow mt12">
                          <button className="btn primary" onClick={printEmployeePdf}>
                            Print Attendance (PDF)
                          </button>
                          <button className="btn ghost" onClick={() => setSelectedEmpId("")}>
                            Close
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* ---------------- FOLDERS ---------------- */}
                {adminTab === "folders" && (
                  <>
                    <div className="sectionTitle">Employee Monitoring - Daily Attendance Records</div>

                    {/* DATE PICKER SEARCH (like your pic) */}
                    <div className="field mt8">
                      <div className="label">Search Date</div>
                      <input
                        type="date"
                        value={folderDatePick}
                        onChange={(e) => setFolderDatePick(e.target.value)}
                      />
                      <div className="mt8">
                        <button className="btn ghost" type="button" onClick={() => setFolderDatePick("")}>
                          Clear Date Search
                        </button>
                      </div>
                    </div>

                    {filteredFolderDates.length === 0 ? (
                      <div className="muted">No matching date folders.</div>
                    ) : (
                      <div className="list">
                        {filteredFolderDates.map((date) => {
                          const dayLogs = dailyFolders.map.get(date) || [];
                          const isCollapsed = collapsedDates.has(date);

                          return (
                            <div key={date} className="item">
                              {/* header: folder title + actions */}
                              <div className="folderHeader">
                                <div className="folderTitle">📁 {date}</div>

                                <div className="folderActionsRow">
                                  <button
                                    className="btn ghost"
                                    type="button"
                                    style={smallActionBtnStyle}
                                    onClick={() => toggleFolder(date)}
                                  >
                                    {isCollapsed ? "Expand" : "Collapse"}
                                  </button>

                                  {/* KEEP: Daily Print PDF*/}
                                  <button
                                    className="btn primary"
                                    type="button"
                                    style={smallActionBtnStyle}
                                    onClick={() => printDailyFolderPdf(date, dayLogs)}
                                    disabled={dayLogs.length === 0}
                                  >
                                    Print (PDF)
                                  </button>
                                </div>
                              </div>

                              {/* content collapsible */}
                              {!isCollapsed && (
                                <div className="list mt10">
                                  {dayLogs.map((r, i) => {
                                    const emp = usersMap.get("employee_" + r.id) || null;
                                    const finished = !!r.timeOut;
                                    const durMs = finished ? Math.max(0, r.timeOut - r.timeIn) : 0;
                                    const status = lateInfo(r.timeIn, emp).statusText;

                                    return (
                                      <div key={i} className="item flexBetweenGap12">
                                        <div className="flex1">
                                          <div>
                                            <b>Employee Name:</b> {emp ? fullNameOf(emp) : "UNKNOWN"}
                                          </div>
                                          <div>
                                            <b>Employee ID:</b> {r.id}
                                          </div>
                                          <div>
                                            <b>Sex:</b> {emp?.sex || "-"}
                                          </div>
                                          <div>
                                            <b>Phone:</b> {emp?.phone || "-"}
                                          </div>
                                          <div>
                                            <b>Position:</b> {emp?.position || "-"}
                                          </div>
                                          <div>
                                            <b>Status:</b> {status}
                                          </div>
                                          <div>
                                            <b>Time In (PH):</b> {formatPH(r.timeIn)}
                                          </div>

                                          <div>
                                            <b>Time Out (PH):</b>{" "}
                                            {r.timeOut ? formatPH(r.timeOut) : `Active • Counting: ${formatHMS(now - r.timeIn)}`}
                                          </div>

                                          <div>
                                            <b>Total:</b>{" "}
                                            {finished
                                              ? `${formatHoursMinutes(durMs)} (${hoursFromMs(durMs).toFixed(2)} hrs)`
                                              : `${formatHMS(now - r.timeIn)} (ACTIVE)`}
                                          </div>
                                        </div>

                                        <button className="btn danger" style={miniBtn} title="Delete Record" onClick={() => adminDeleteOneRecord(r)}>
                                          −
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </Shell>
    );

  return null;
}
