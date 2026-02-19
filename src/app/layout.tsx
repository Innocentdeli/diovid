import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Diovid | The Multimodal Story Director",
  description: "Turn one photo into unlimited stories with the power of Gemini 1.5 Pro.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="dark bg-background selection:bg-primary/30 antialiased">
        {children}
      </body>
    </html>
  );
}
