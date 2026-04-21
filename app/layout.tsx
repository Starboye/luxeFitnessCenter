import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Luxe Fitness",
  description: "Gym management, member attendance, and trainer operations for Luxe Fitness in Perungudi, Chennai.",
  icons: {
    icon: "/media/Luxe_Fitness_Logo.jpg",
    shortcut: "/media/Luxe_Fitness_Logo.jpg",
    apple: "/media/Luxe_Fitness_Logo.jpg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
