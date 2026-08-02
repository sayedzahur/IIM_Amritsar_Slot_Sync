import { NextResponse } from "next/server";
import { readAll, appendRow, updateRow, nextId } from "../../../lib/csvStore";
import { rangesOverlap } from "../../../lib/slots";

const NAME = "library";
const HEADERS = [
  "id",
  "name",
  "rollNo",
  "contact",
  "roomNo",
  "date",
  "fromTime",
  "toTime",
  "purpose",
  "status",
  "rejectReason",
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
    "contact",
    "roomNo",
    "date",
    "fromTime",
    "toTime",
    "purpose",
  ];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json(
        { error: `Missing required field: ${field}` },
        { status: 400 }
      );
    }
  }
  if (body.toTime <= body.fromTime) {
    return NextResponse.json(
      { error: "'To' time must be after 'from' time." },
      { status: 400 }
    );
  }

  const rows = readAll(NAME, HEADERS);

  const conflict = rows.find(
    (r) =>
      r.roomNo === body.roomNo &&
      r.date === body.date &&
      r.status !== "cancelled" &&
      r.status !== "rejected" &&
      rangesOverlap(r.fromTime, r.toTime, body.fromTime, body.toTime)
  );
  if (conflict) {
    return NextResponse.json(
      {
        error: `${body.roomNo} is already blocked from ${conflict.fromTime} to ${conflict.toTime} on ${body.date} by ${conflict.name} (Roll No. ${conflict.rollNo}). Please choose another slot or room.`,
      },
      { status: 409 }
    );
  }

  const row = {
    id: nextId(rows),
    name: body.name,
    rollNo: body.rollNo,
    contact: body.contact,
    roomNo: body.roomNo,
    date: body.date,
    fromTime: body.fromTime,
    toTime: body.toTime,
    purpose: body.purpose,
    status: "pending",
    bookedAt: new Date().toISOString(),
  };
  appendRow(NAME, HEADERS, row);
  return NextResponse.json({ booking: row }, { status: 201 });
}

// Manager action: approve or reject a conference room booking
export async function PATCH(request) {
  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  let status = body.status;
  let rejectReason = "";
  if (body.action === "approve") status = "approved";
  if (body.action === "reject") {
    status = "rejected";
    if (!body.reason || !body.reason.trim()) {
      return NextResponse.json(
        { error: "A reason is required to reject a booking." },
        { status: 400 }
      );
    }
    rejectReason = body.reason.trim();
  }
  if (!status) {
    return NextResponse.json({ error: "Missing action/status" }, { status: 400 });
  }
  const updates = { status };
  if (status === "rejected") updates.rejectReason = rejectReason;
  const updated = updateRow(NAME, HEADERS, body.id, updates);
  if (!updated) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  return NextResponse.json({ booking: updated });
}
