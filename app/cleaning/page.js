"use client";

import { useEffect, useState } from "react";

const SLOTS = [
  "08:00-08:30", "08:30-09:00", "09:00-09:30", "09:30-10:00",
  "10:00-10:30", "10:30-11:00", "11:00-11:30", "11:30-12:00",
  "13:00-13:30", "13:30-14:00", "14:00-14:30", "14:30-15:00",
  "15:00-15:30", "15:30-16:00",
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function CleaningPage() {
  const [date, setDate] = useState(todayStr());
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({
    name: "", rollNo: "", roomNo: "", floorNo: "", blockName: "", contact: "",
  });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadBookings() {
    const res = await fetch(`/api/cleaning?date=${date}`);
    const data = await res.json();
    setBookings(data.bookings || []);
  }

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const bookedSlots = new Set(
    bookings.filter((b) => b.status !== "cancelled").map((b) => b.slot)
  );

  function updateField(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submitBooking(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedSlot) {
      setError("Please select a slot first.");
      return;
    }
    for (const key of Object.keys(form)) {
      if (!form[key]) {
        setError("Please fill in every field before booking.");
        return;
      }
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/cleaning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slot: selectedSlot, date }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setSuccess(`Slot ${selectedSlot} booked for ${form.name}.`);
        setSelectedSlot(null);
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
        <h1>Cleaning Staff Slot Booking</h1>
        <p className="page-sub">
          Slots run 8:00 AM&ndash;12:00 PM and 1:00 PM&ndash;4:00 PM, in 30-minute blocks.
          A slot already taken by someone else will show as blocked below.
        </p>
      </div>

      <div className="card">
        <label style={{ maxWidth: 220 }}>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <h3 className="section-title">Pick a slot</h3>
        <div className="slot-grid">
          {SLOTS.map((slot) => {
            const isBooked = bookedSlots.has(slot);
            const isSelected = selectedSlot === slot;
            return (
              <button
                type="button"
                key={slot}
                disabled={isBooked}
                onClick={() => setSelectedSlot(slot)}
                className={`slot-btn ${isBooked ? "booked" : "available"} ${isSelected ? "selected" : ""}`}
                title={isBooked ? "Already blocked by another student" : "Available"}
              >
                {slot}
              </button>
            );
          })}
        </div>

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
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? "Booking…" : "Book this slot"}
            </button>
          </div>
        </form>
      </div>

      <h3 className="section-title">Bookings on {date}</h3>
      <div className="card">
        {bookings.length === 0 ? (
          <div className="empty-state">No bookings yet for this date.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Slot</th><th>Name</th><th>Roll No.</th><th>Room</th><th>Block</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[...bookings].sort((a, b) => a.slot.localeCompare(b.slot)).map((b) => (
                <tr key={b.id}>
                  <td>{b.slot}</td>
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
