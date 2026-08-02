"use client";

import { useEffect, useState } from "react";
import BackLink from "../components/BackLink";
import { nowInIST } from "../../lib/slots";

const ROOMS = ["Conference Room 1", "Conference Room 2"];

function todayStr() {
  return nowInIST().date;
}

export default function LibraryPage() {
  const [date, setDate] = useState(todayStr());
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({
    name: "", rollNo: "", contact: "", roomNo: ROOMS[0],
    fromTime: "", toTime: "", purpose: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadBookings() {
    setLoading(true);
    const res = await fetch(`/api/library?date=${date}`);
    const data = await res.json();
    setBookings(data.bookings || []);
    setLoading(false);
  }

  const isToday = date === todayStr();
  const minFromTime = isToday ? nowInIST().time : undefined;

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  function updateField(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submitBooking(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    for (const key of Object.keys(form)) {
      if (!form[key]) {
        setError("Please fill in every field before booking.");
        return;
      }
    }
    if (isToday && form.fromTime < minFromTime) {
      setError("That time has already passed today. Please choose a later time.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, date }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setSuccess(`${form.roomNo} booked from ${form.fromTime} to ${form.toTime}. Awaiting manager approval.`);
        setForm({ name: "", rollNo: "", contact: "", roomNo: ROOMS[0], fromTime: "", toTime: "", purpose: "" });
        loadBookings();
      }
    } catch (err) {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <BackLink />
      <div className="page-header">
        <span className="eyebrow">Library Services</span>
        <h1>Conference Room Booking</h1>
        <p className="page-sub">
          Available 24x7 across Conference Rooms 1&ndash;6. Choose your own from/to
          time &mdash; overlapping requests for the same room will be blocked.
        </p>
      </div>

      <div className="card">
        <label style={{ maxWidth: 220 }}>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        {isToday && <p className="hint">Times earlier than now ({minFromTime} IST) are disabled for today.</p>}

        <form onSubmit={submitBooking}>
          <h3 className="section-title">Your details</h3>
          <div className="form-grid">
            <label>Name<input name="name" value={form.name} onChange={updateField} placeholder="Full name" /></label>
            <label>Roll No.<input name="rollNo" value={form.rollNo} onChange={updateField} placeholder="e.g. IPM21001" /></label>
            <label>Contact No.<input name="contact" value={form.contact} onChange={updateField} placeholder="10-digit mobile" /></label>
            <label>
              Conference Room
              <select name="roomNo" value={form.roomNo} onChange={updateField}>
                {ROOMS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label>From
              <input type="time" name="fromTime" value={form.fromTime} onChange={updateField} min={minFromTime} />
            </label>
            <label>To<input type="time" name="toTime" value={form.toTime} onChange={updateField} /></label>
            <label className="full-width">
              Purpose
              <textarea name="purpose" value={form.purpose} onChange={updateField} rows={2} placeholder="e.g. Group project discussion" />
            </label>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div style={{ marginTop: "1.2rem" }}>
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? "Booking…" : "Book conference room"}
            </button>
          </div>
        </form>
      </div>

      <h3 className="section-title">Bookings on {date}</h3>
      <div className="card">
        {loading ? (
          <div className="loading-state">Loading bookings…</div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">No conference room bookings yet for this date.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Room</th><th>Time</th><th>Name</th><th>Roll No.</th><th>Purpose</th><th>Status</th><th>Reason (if rejected)</th>
              </tr>
            </thead>
            <tbody>
              {[...bookings].sort((a, b) => a.roomNo.localeCompare(b.roomNo) || a.fromTime.localeCompare(b.fromTime)).map((b) => (
                <tr key={b.id}>
                  <td>{b.roomNo}</td>
                  <td>{b.fromTime}&ndash;{b.toTime}</td>
                  <td>{b.name}</td>
                  <td>{b.rollNo}</td>
                  <td>{b.purpose}</td>
                  <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                  <td>{b.status === "rejected" ? b.rejectReason : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
