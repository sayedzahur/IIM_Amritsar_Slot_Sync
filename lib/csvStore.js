// lib/csvStore.js
//
// Tiny dependency-free CSV "database" for prototype purposes.
// Each module (cleaning / laundry / library / classroom) gets its own
// CSV file under /data with a fixed header row. Rows are plain objects.
//
// NOTE: This works fine on a normal server or VM with a persistent disk.
// It will NOT persist on serverless platforms with an ephemeral/read-only
// filesystem (e.g. Vercel's default runtime) — see README.md.

import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function filePath(name) {
  return path.join(DATA_DIR, `${name}.csv`);
}

function ensureFile(name, headers) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const fp = filePath(name);
  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, headers.join(",") + "\n", "utf8");
  }
  return fp;
}

// Escape a single CSV field
function escapeField(value) {
  const str = value === undefined || value === null ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Parse a single CSV line respecting quoted fields
function parseLine(line) {
  const result = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
  }
  result.push(cur);
  return result;
}

export function readAll(name, headers) {
  const fp = ensureFile(name, headers);
  const raw = fs.readFileSync(fp, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length <= 1) return [];
  const fileHeaders = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    const row = {};
    fileHeaders.forEach((h, idx) => {
      row[h] = values[idx] !== undefined ? values[idx] : "";
    });
    return row;
  });
}

function writeAll(name, headers, rows) {
  const fp = filePath(name);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeField(row[h])).join(","));
  }
  fs.writeFileSync(fp, lines.join("\n") + "\n", "utf8");
}

export function appendRow(name, headers, row) {
  ensureFile(name, headers);
  const rows = readAll(name, headers);
  rows.push(row);
  writeAll(name, headers, rows);
  return row;
}

export function updateRow(name, headers, id, updates) {
  const rows = readAll(name, headers);
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...updates };
  writeAll(name, headers, rows);
  return rows[idx];
}

export function nextId(rows) {
  const max = rows.reduce((m, r) => {
    const n = parseInt(r.id, 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return String(max + 1);
}
