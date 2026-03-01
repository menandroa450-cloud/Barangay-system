
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import ExcelJS from "exceljs";

export async function GET() {
  const records = await prisma.attendanceRecord.findMany({
    include: { user: true },
    orderBy: { timeIn: "desc" },
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Attendance");

  ws.columns = [
    { header: "Role", key: "role", width: 12 },
    { header: "User ID", key: "userId", width: 18 },
    { header: "Name", key: "name", width: 28 },
    { header: "Date", key: "dateKey", width: 14 },
    { header: "Time In", key: "timeIn", width: 22 },
    { header: "Time Out", key: "timeOut", width: 22 },
  ];

  for (const r of records) {
    const name = r.user ? `${r.user.firstName} ${r.user.lastName}` : "";
    ws.addRow({
      role: r.role,
      userId: r.userId,
      name,
      dateKey: r.dateKey,
      timeIn: r.timeIn.toISOString(),
      timeOut: r.timeOut ? r.timeOut.toISOString() : "",
    });
  }

  ws.getRow(1).font = { bold: true };

  const buf = await wb.xlsx.writeBuffer();

  return new NextResponse(Buffer.from(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="attendance.xlsx"',
    },
  });
}
