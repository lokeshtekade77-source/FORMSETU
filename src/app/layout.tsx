import "./globals.css";
import { DemoProvider } from "@/components/DemoProvider";

export const metadata = {
  title: "FormSetu — Civic Application & Document Suite",
  description: "Apply Smarter to Public Services — Fill Once, Auto-Adapt Everywhere."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-surface font-sans antialiased">
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
