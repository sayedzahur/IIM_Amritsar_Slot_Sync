import { NextResponse } from "next/server";
import { readAll, appendRow, updateRow, nextId } from "../../../lib/csvStore";

const NAME = "laundry";
const HEADERS = [
  "id",
  "name",
  "rollNo",
  "roomNo",
  "floorNo",
  "blockName",
  "contact",
  "sequence",
  "date",
  "status",
  "bookedAt",
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  let rows = readAll(NAME, HEADERS);
  if (date) rows = rows.filter((r) => r.date === date);
  rows.sort((a, b) => Number(a.sequence) - Number(b.sequence));
  return NextResponse.json({ bookings: rows });
}

export async function POST(request) {
  const body = await request.json();
  const required = [
    "name",
    "rollNo",
    "roomNo",
    "floorNo",
    "blockName",
    "contact",
    "date",
  ];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json(
        { error: `Missing required field: ${field}` },
        { status: 400 }
      );
    }
  }

  const rows = readAll(NAME, HEADERS);

  // A student can't register again until their existing registration
  // is marked completed by the laundry manager.
  const active = rows.find(
    (r) => r.rollNo === body.rollNo && r.status !== "completed"
  );
  if (active) {
    return NextResponse.json(
      {
        error: `You already have an active laundry registration (sequence #${active.sequence}, status: ${active.status}). You can register again only after it is marked completed.`,
      },
      { status: 409 }
    );
  }

  // Sequence is first-come-first-serve for the given date, based on
  // how many active (non-completed) registrations already exist for that date.
  const sameDateActive = rows.filter(
    (r) => r.date === body.date && r.status !== "completed"
  );
  const sequence = sameDateActive.length + 1;

  const row = {
    id: nextId(rows),
    name: body.name,
    rollNo: body.rollNo,
    roomNo: body.roomNo,
    floorNo: body.floorNo,
    blockName: body.blockName,
    contact: body.contact,
    sequence: String(sequence),
    date: body.date,
    status: "pending",
    bookedAt: new Date().toISOString(),
  };
  appendRow(NAME, HEADERS, row);
  return NextResponse.json({ booking: row }, { status: 201 });
}

// Manager action: mark a laundry registration completed, freeing up the
// student to register again in future.
export async function PATCH(request) {
  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const status = body.action === "complete" ? "completed" : body.status;
  if (!status) {
    return NextResponse.json({ error: "Missing action/status" }, { status: 400 });
  }
  const updated = updateRow(NAME, HEADERS, body.id, { status });
  if (!updated) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  return NextResponse.json({ booking: updated });
}
