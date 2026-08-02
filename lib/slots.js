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

// Returns the current date/time as IST (Asia/Kolkata, UTC+5:30) wall-clock
// values, regardless of what timezone the browser or server happens to be
// running in. Used to grey out / reject slots that have already passed
// "today" for IIM Amritsar's campus clock.
export function nowInIST() {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const ist = new Date(Date.now() + IST_OFFSET_MS);
  const yyyy = ist.getUTCFullYear();
  const mm = pad(ist.getUTCMonth() + 1);
  const dd = pad(ist.getUTCDate());
  const hh = pad(ist.getUTCHours());
  const min = pad(ist.getUTCMinutes());
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
}

// Cleaning staff slots: 8AM-12PM and 1PM-4PM, 30-min each
export function cleaningSlots() {
  return [...generateRange("08:00", "12:00"), ...generateRange("13:00", "16:00")];
}

// Returns true if [aStart, aEnd) overlaps [bStart, bEnd) — all HH:MM.
// Handles overnight ranges (e.g. a booking spanning midnight) by treating
// times that wrap past midnight as "next day" minutes.
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
