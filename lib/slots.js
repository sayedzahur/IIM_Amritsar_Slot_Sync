// lib/slots.js
// Helpers for fixed 30-min slot generation (cleaning) and free-form
// from/to time range overlap checks (library + classroom).

function pad(n) {
  return String(n).padStart(2, "0");
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${pad(h)}:${pad(m)}`;
}

// Generates 30-minute slot labels like "08:00-08:30" between two
// HH:MM boundaries (24h clock, same-day range).
function generateRange(startHHMM, endHHMM) {
  const slots = [];
  let cur = toMinutes(startHHMM);
  const end = toMinutes(endHHMM);
  while (cur < end) {
    const next = cur + 30;
    slots.push(`${fromMinutes(cur)}-${fromMinutes(next)}`);
    cur = next;
  }
  return slots;
}

// Cleaning staff slots: 8AM-12PM and 1PM-4PM, 30-min each
export function cleaningSlots() {
  return [...generateRange("08:00", "12:00"), ...generateRange("13:00", "16:00")];
}

// Returns true if [aStart, aEnd) overlaps [bStart, bEnd) — all HH:MM.
// Handles overnight ranges (e.g. classroom 19:00 -> 06:00) by treating
// times before 07:00 as "next day" minutes when the range crosses midnight.
export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  const norm = (start, end) => {
    let s = toMinutes(start);
    let e = toMinutes(end);
    if (e <= s) e += 24 * 60; // crosses midnight
    return [s, e];
  };
  const [aS, aE] = norm(aStart, aEnd);
  const [bS, bE] = norm(bStart, bEnd);
  return aS < bE && bS < aE;
}

// Classroom booking window is 7PM to 6AM. Validates a from/to pair
// falls within that overnight window.
export function isWithinClassroomWindow(from, to) {
  const WINDOW_START = toMinutes("19:00");
  const WINDOW_END = toMinutes("06:00") + 24 * 60; // treat as next-day 30:00
  let s = toMinutes(from);
  let e = toMinutes(to);
  if (s < WINDOW_START) s += 24 * 60; // e.g. 01:00 -> 25:00
  if (e <= s) e += 24 * 60;
  return s >= WINDOW_START && e <= WINDOW_END;
}
