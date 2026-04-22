import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE Cloud Database ───────────────────────────────────────────────
// Replaces local db.json for Vercel deployment.
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_KEY || ""; 

let supabase: any = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

const DEFAULT_DB = {
  expenses: [],
  tasks: [],
  fitness: [],
  journal: [],
  balances: { saving: 0, spending: 0, cash: 0 },
};

async function readDB() {
  if (!supabase) {
    // Local fallback — works in dev without Supabase
    const fs = await import("fs");
    const path = await import("path");
    const JSON_PATH = path.join(process.cwd(), "src/data/db.json");
    try {
      const raw = fs.readFileSync(JSON_PATH, "utf8");
      const data = JSON.parse(raw);
      if (!data.fitness) data.fitness = [];
      if (!data.journal) data.journal = [];
      if (!data.balances) data.balances = { saving: 0, spending: 0, cash: 0 };
      return data;
    } catch {
      return { ...DEFAULT_DB };
    }
  }

  // Fetch from Supabase
  const { data, error } = await supabase
    .from("dashboard")
    .select("state")
    .eq("id", 1)
    .single();

  if (error || !data) {
    if (error && error.code !== "PGRST116") console.error("Supabase Read Error:", error);
    return { ...DEFAULT_DB };
  }

  const state = data.state;
  if (!state.fitness) state.fitness = [];
  if (!state.journal) state.journal = [];
  if (!state.balances) state.balances = { saving: 0, spending: 0, cash: 0 };
  return state;
}

async function writeDB(data: any) {
  if (!supabase) {
    // Local fallback
    const fs = await import("fs");
    const path = await import("path");
    const JSON_PATH = path.join(process.cwd(), "src/data/db.json");
    fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));
    return;
  }

  // Update in Supabase
  const { error } = await supabase
    .from("dashboard")
    .update({ state: data })
    .eq("id", 1);

  if (error) {
    console.error("Supabase Write Error:", error);
    throw new Error(`Supabase write error: ${error.message}`);
  }
}

function buildExcelBuffer(expenses: any[]): Uint8Array {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(expenses);
  XLSX.utils.book_append_sheet(wb, ws, "Expenses");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" });
}

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const data = await readDB();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Failed to read data" }, { status: 500 });
  }
}

// ─── POST ────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { type, payload } = await req.json();
    const data = await readDB();

    if (type === "expense") {
      data.expenses.push({ ...payload, id: Date.now().toString() });
      if (data.balances[payload.account] !== undefined) {
        data.balances[payload.account] -= Number(payload.amount);
      }
    } else if (type === "income") {
      if (data.balances[payload.account] !== undefined) {
        data.balances[payload.account] += Number(payload.amount);
      }
    } else if (type === "task") {
      data.tasks.push({ ...payload, id: Date.now().toString(), status: "pending" });
    } else if (type === "fitness") {
      data.fitness.push({ ...payload, id: Date.now().toString() });
    } else if (type === "journal") {
      data.journal.push({ ...payload, id: Date.now().toString() });
    }

    await writeDB(data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}

// ─── PUT ─────────────────────────────────────────────────────────────────────
export async function PUT(req: Request) {
  try {
    const { type, id, payload } = await req.json();
    const data = await readDB();

    if (type === "task_status") {
      const task = data.tasks.find((t: any) => t.id === id);
      if (task) task.status = task.status === "pending" ? "completed" : "pending";
    } else if (type === "balance") {
      if (payload?.account && data.balances[payload.account] !== undefined) {
        data.balances[payload.account] = Number(payload.amount);
      }
    }

    await writeDB(data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("PUT error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const { type, id } = await req.json();
    const data = await readDB();

    if (type === "expense") {
      const exp = data.expenses.find((e: any) => e.id === id);
      if (exp && data.balances[exp.account] !== undefined) {
        data.balances[exp.account] += Number(exp.amount); // refund
      }
      data.expenses = data.expenses.filter((e: any) => e.id !== id);
    } else if (type === "task") {
      data.tasks = data.tasks.filter((t: any) => t.id !== id);
    } else if (type === "fitness") {
      data.fitness = data.fitness.filter((f: any) => f.id !== id);
    } else if (type === "journal") {
      data.journal = data.journal.filter((j: any) => j.id !== id);
    }

    await writeDB(data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

// ─── REPORT (Excel Download) ─────────────────────────────────────────────────
export async function PATCH() {
  try {
    const data = await readDB();
    const buf = buildExcelBuffer(data.expenses);
    return new Response(buf as any, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=expenses.xlsx",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
