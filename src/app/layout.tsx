import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'Grafito GraftMaster',
  description: 'Dashboard for the Grafito robotic grafting machine.',
};

import { useEffect } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // Disable right-click
    const disableContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", disableContextMenu);

    // Block common shortcuts
    const blockKeys = (e: KeyboardEvent) => {
      // Block F12, Ctrl+Shift+I/J/C/U, Ctrl+R, Ctrl+T, Ctrl+W, Alt+F4, F5, etc.
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C", "U"].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && ["R", "T", "W"].includes(e.key.toUpperCase())) ||
        (e.key === "F5") ||
        (e.altKey && e.key === "F4")
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    document.addEventListener("keydown", blockKeys, true);

    // Clean up on unmount
    return () => {
      document.removeEventListener("contextmenu", disableContextMenu);
      document.removeEventListener("keydown", blockKeys, true);
    };
  }, []);

  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-title" content="Grafito GraftMaster" />
        <meta name="application-name" content="Grafito GraftMaster" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
        <link rel="icon" type="image/png" href="/grafito_innovations_logo_only-removebg-preview.png" sizes="32x32" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
