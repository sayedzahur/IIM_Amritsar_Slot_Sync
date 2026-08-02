import { NextResponse } from "next/server";
import { readAll, appendRow, updateRow, nextId } from "../../../lib/csvStore";
import { nowInIST } from "../../../lib/slots";

const NAME = "cleaning";
const HEADERS = [
  "id",
  "name",
  "rollNo",
  "roomNo",
  "floorNo",
  "blockName",
  "contact",
  "slot",
  "date",
  "status",
  "bookedAt",
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  let rows = readAll(NAME, HEADERS);
  if (date) rows = rows.filter((r) => r.date === date);
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
    "slot",
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

  const ist = nowInIST();
  if (body.date === ist.date) {
    const slotStart = body.slot.split("-")[0];
    if (slotStart <= ist.time) {
      return NextResponse.json(
        { error: "That slot has already passed today. Please choose a later slot." },
        { status: 400 }
      );
    }
  }

  // Conflict check: same date + same slot, not already booked by someone else
  const conflict = rows.find(
    (r) => r.date === body.date && r.slot === body.slot && r.status !== "cancelled"
  );
  if (conflict) {
    return NextResponse.json(
      {
        error: `This slot (${body.slot} on ${body.date}) has already been blocked by ${conflict.name} (Roll No. ${conflict.rollNo}). Please choose another slot.`,
      },
      { status: 409 }
    );
  }

  const row = {
    id: nextId(rows),
    name: body.name,
    rollNo: body.rollNo,
    roomNo: body.roomNo,
    floorNo: body.floorNo,
    blockName: body.blockName,
    contact: body.contact,
    slot: body.slot,
    date: body.date,
    status: "pending",
    bookedAt: new Date().toISOString(),
  };
  appendRow(NAME, HEADERS, row);
  return NextResponse.json({ booking: row }, { status: 201 });
}

// Manager action: mark a booking completed
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
