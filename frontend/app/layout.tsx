import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Universal AI Platform — AI Workspace",
  description: "Votre espace de travail intelligent pour créer, connecter et piloter vos assistants IA.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
