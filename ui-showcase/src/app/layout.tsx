import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { NotificationProvider } from "@/lib/notifications/use-desktop-notifications";
import { NotificationCenter } from "@/components/notifications/notification-center";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finance OS",
  description: "A locally hosted personal finance operating system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NotificationProvider>
          {children}
          <NotificationCenter />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "rgba(10, 10, 11, 0.92)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                color: "#fff",
                fontSize: "13px",
                fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
              },
            }}
          />
        </NotificationProvider>
      </body>
    </html>
  );
}
