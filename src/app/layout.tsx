import type { Metadata } from "next";
import "./globals.css";
import { DashboardProvider } from "@/store/DashboardProvider";

export const metadata: Metadata = {
  title: "AgentOps — ศูนย์บัญชาการปฏิบัติการ AI",
  description:
    "แดชบอร์ดปฏิบัติการสุดล้ำสำหรับติดตามการทำงานของ AI Agent ทั้งสถานะ งาน ความคืบหน้า บันทึกการทำงาน และออฟฟิศเอเจนต์แบบเรียลไทม์",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className="dark">
      <body className="min-h-screen">
        <DashboardProvider>{children}</DashboardProvider>
      </body>
    </html>
  );
}
