"use client";

import { useEffect, useState } from "react";

// Prototype-only credential. See README.md for how to change this and
// why this is NOT sufficient security for a real deployment.
const MANAGER_PASSWORD = "iimamritsar2026";

const MODULES = [
  { key: "cleaning", label: "Cleaning Staff", action: "complete", actionLabel: "Mark Completed", statusFlow: ["pending", "completed"] },
  { key: "laundry", label: "Laundry", action: "complete", actionLabel: "Mark Completed", statusFlow: ["pending", "completed"] },
  { key: "library", label: "Conference Room", action: "approve", actionLabel: "Approve", statusFlow: ["pending", "approved", "rejected"] },
  { key: "classroom", label: "Classroom", action: "approve", actionLabel: "Approve", statusFlow: ["pending", "approved", "rejected"] },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function LoginGate({ onLogin }) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    if (pwd === MANAGER_PASSWORD) {
      sessionStorage.setItem("manager-auth", "1");
      onLogin();
    } else {
      setError("Incorrect password.");
    }
  }

  return (
    <div className="page">
      <div className="login-shell card">
        <span className="eyebrow">Staff Access</span>
        <h1>Manager Login</h1>
        <p className="page-sub">
          Approve library &amp; classroom bookings, and mark cleaning &amp;
          laundry jobs complete.
        </p>
        <form onSubmit={submit} style={{ marginTop: "1rem" }}>
          <label>
            Password
            <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Manager password" />
          </label>
          {error && <div className="alert alert-error">{error}</div>}
          <div style={{ marginTop: "1rem" }}>
            <button className="btn" type="submit">Log in</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModuleTable({ mod, date }) {
  const [rows, setRows] = useState([]);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    const res = await fetch(`/api/${mod.key}?date=${date}`);
    const data = await res.json();
    setRows(data.bookings || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, mod.key]);

  async function act(id, action) {
    setBusyId(id);
    try {
      await fetch(`/api/${mod.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  const isSlotBased = mod.key === "cleaning";
  const isSequenceBased = mod.key === "laundry";

  return (
    <div className="card">
      {rows.length === 0 ? (
        <div className="empty-state">Nothing booked for this date.</div>
      ) : (
        <table>
          <thead>
            <tr>
              {isSlotBased && <th>Slot</th>}
              {isSequenceBased && <th>#</th>}
              {!isSlotBased && !isSequenceBased && <th>Room / Time</th>}
              <th>Name</th>
              <th>Roll No.</th>
              <th>Contact</th>
              {!isSlotBased && !isSequenceBased && <th>Purpose</th>}
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                {isSlotBased && <td>{r.slot}</td>}
                {isSequenceBased && <td>{r.sequence}</td>}
                {!isSlotBased && !isSequenceBased && <td>{r.roomNo} · {r.fromTime}&ndash;{r.toTime}</td>}
                <td>{r.name}</td>
                <td>{r.rollNo}</td>
                <td>{r.contact}</td>
                {!isSlotBased && !isSequenceBased && <td>{r.purpose}</td>}
                <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                <td>
                  {r.status === "pending" ? (
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button
                        className="btn btn-green btn-sm"
                        disabled={busyId === r.id}
                        onClick={() => act(r.id, mod.action)}
                      >
                        {mod.actionLabel}
                      </button>
                      {mod.action === "approve" && (
                        <button
                          className="btn btn-red btn-sm"
                          disabled={busyId === r.id}
                          onClick={() => act(r.id, "reject")}
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="hint">No action</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function ManagerPage() {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [date, setDate] = useState(todayStr());
  const [activeTab, setActiveTab] = useState(MODULES[0].key);

  useEffect(() => {
    setAuthed(sessionStorage.getItem("manager-auth") === "1");
    setChecked(true);
  }, []);

  if (!checked) return null;
  if (!authed) return <LoginGate onLogin={() => setAuthed(true)} />;

  const activeModule = MODULES.find((m) => m.key === activeTab);

  return (
    <div className="page">
      <div className="page-header">
        <span className="eyebrow">Staff Access</span>
        <h1>Manager Dashboard</h1>
        <p className="page-sub">
          Review today's requests for each service. Approve or reject library
          and classroom bookings; mark cleaning and laundry jobs complete once
          finished.
        </p>
      </div>

      <label style={{ maxWidth: 220, marginBottom: "1rem", display: "flex" }}>
        Date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      <div className="tabs">
        {MODULES.map((m) => (
          <button
            key={m.key}
            className={`tab-btn ${activeTab === m.key ? "active" : ""}`}
            onClick={() => setActiveTab(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <ModuleTable mod={activeModule} date={date} />

      <p className="hint" style={{ marginTop: "1.5rem" }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => {
            sessionStorage.removeItem("manager-auth");
            setAuthed(false);
          }}
        >
          Log out
        </button>
      </p>
    </div>
  );
}
