import "./globals.css";

export const metadata = {
  title: "Barangay Attendance System",
  description: "Capstone-ready full-stack version (Next.js + Prisma DB)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
