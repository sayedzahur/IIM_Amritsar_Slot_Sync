export default function Home() {
  return (
    <div className="hero">
      <span className="eyebrow">Campus Services</span>
      <h1>Book what you need, without the WhatsApp group chaos.</h1>
      <p>
        One portal for the four bookings hostel life runs on: cleaning staff
        slots, laundry sequence, library conference rooms and post-hours
        classrooms. Pick a service, fill in your details, and see instantly
        if a slot is free.
      </p>

      <div className="card-grid">
        <a className="service-card" href="/cleaning">
          <span className="icon icon-blue">🧹</span>
          <h3>Cleaning Staff Slot</h3>
          <p>Book a 30-minute cleaning slot, 8&ndash;12 &amp; 1&ndash;4.</p>
        </a>
        <a className="service-card" href="/laundry">
          <span className="icon icon-green">🧺</span>
          <h3>Laundry Sequence</h3>
          <p>Register on a first-come, first-served basis.</p>
        </a>
        <a className="service-card" href="/library">
          <span className="icon icon-orange">📚</span>
          <h3>Conference Room</h3>
          <p>Book Conference Room 1&ndash;6, any time, 24x7.</p>
        </a>
        <a className="service-card" href="/classroom">
          <span className="icon icon-blue">🏫</span>
          <h3>Classroom Booking</h3>
          <p>Book Classroom 1&ndash;14 post class hours, 7PM&ndash;6AM.</p>
        </a>
      </div>

      <p className="hint" style={{ marginTop: "2rem" }}>
        Managing bookings? Head to the{" "}
        <a href="/manager">Manager Login</a> to approve requests and mark
        jobs complete.
      </p>
    </div>
  );
}
