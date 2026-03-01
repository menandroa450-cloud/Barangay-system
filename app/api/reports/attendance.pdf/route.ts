
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import PDFDocument from "pdfkit";

export async function GET() {
  const records = await prisma.attendanceRecord.findMany({
    include: { user: true },
    orderBy: { timeIn: "desc" },
    take: 500, // cap for PDF size
  });

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const chunks: Buffer[] = [];

  doc.on("data", (c) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  doc.fontSize(18).text("Attendance Report", { align: "left" });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`);
  doc.moveDown(1);

  doc.fontSize(11).text("Role | ID | Name | Date | Time In | Time Out");
  doc.moveDown(0.25);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(0.5);

  doc.fontSize(9);

  for (const r of records) {
    const name = r.user ? `${r.user.firstName} ${r.user.lastName}` : "";
    const line = `${r.role} | ${r.userId} | ${name} | ${r.dateKey} | ${r.timeIn.toISOString()} | ${r.timeOut ? r.timeOut.toISOString() : ""}`;
    doc.text(line, { width: 515 });
    doc.moveDown(0.2);
    if (doc.y > 780) doc.addPage();
  }

  doc.end();
  const pdf = await done;

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="attendance.pdf"',
    },
  });
}
