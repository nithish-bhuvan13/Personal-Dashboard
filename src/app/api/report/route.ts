import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

const EXCEL_PATH = path.join(process.cwd(), "src/data", "expenses.xlsx");

export async function GET() {
  try {
    if (!fs.existsSync(EXCEL_PATH)) {
      return NextResponse.json({ error: "No report available" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(EXCEL_PATH);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Disposition": 'attachment; filename="Business_Report.xlsx"',
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to download report" }, { status: 500 });
  }
}
