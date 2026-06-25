import type { Metadata } from "next";
import "./global.css"; // Next.js will bundle this flawlessly

export const metadata: Metadata = {
  title: "Intelligence Workspace",
  description: "AI-Native Multi-Session Environment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-100">{children}</body>
    </html>
  );
}
