"use client";

import { useEffect, useState } from "react";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function LaundryPage() {
  const [date, setDate] = useState(todayStr());
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({
    name: "", rollNo: "", roomNo: "", floorNo: "", blockName: "", contact: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadBookings() {
    const res = await fetch(`/api/laundry?date=${date}`);
    const data = await res.json();
    setBookings(data.bookings || []);
  }

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
        setError("Please fill in every field before registering.");
        return;
      }
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/laundry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, date }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setSuccess(`Registered! You are #${data.booking.sequence} in the queue for ${date}.`);
        setForm({ name: "", rollNo: "", roomNo: "", floorNo: "", blockName: "", contact: "" });
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
      <div className="page-header">
        <span className="eyebrow">Hostel Services</span>
        <h1>Laundry Sequence Registration</h1>
        <p className="page-sub">
          Registration is first come, first served. Once registered you can't
          register again until the laundry manager marks your load complete.
        </p>
      </div>

      <div className="card">
        <label style={{ maxWidth: 220 }}>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <form onSubmit={submitBooking}>
          <h3 className="section-title">Your details</h3>
          <div className="form-grid">
            <label>Name<input name="name" value={form.name} onChange={updateField} placeholder="Full name" /></label>
            <label>Roll No.<input name="rollNo" value={form.rollNo} onChange={updateField} placeholder="e.g. IPM21001" /></label>
            <label>Room No.<input name="roomNo" value={form.roomNo} onChange={updateField} placeholder="e.g. 214" /></label>
            <label>Floor No.<input name="floorNo" value={form.floorNo} onChange={updateField} placeholder="e.g. 2nd" /></label>
            <label>Block Name<input name="blockName" value={form.blockName} onChange={updateField} placeholder="e.g. Block C" /></label>
            <label>Contact No.<input name="contact" value={form.contact} onChange={updateField} placeholder="10-digit mobile" /></label>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div style={{ marginTop: "1.2rem" }}>
            <button className="btn btn-green" type="submit" disabled={submitting}>
              {submitting ? "Registering…" : "Register for laundry"}
            </button>
          </div>
        </form>
      </div>

      <h3 className="section-title">Queue for {date}</h3>
      <div className="card">
        {bookings.length === 0 ? (
          <div className="empty-state">No one has registered for this date yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Roll No.</th><th>Room</th><th>Block</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.sequence}</td>
                  <td>{b.name}</td>
                  <td>{b.rollNo}</td>
                  <td>{b.roomNo}</td>
                  <td>{b.blockName}</td>
                  <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
