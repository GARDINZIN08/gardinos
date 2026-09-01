import type { Metadata } from "next";
import Link from "next/link";
import { sairDoSistema } from "@/lib/actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gardin OS",
  description: "Ordens de Serviço, Produção, Entregas e Financeiro",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col">
        <header className="bg-marca-preto text-marca-branco">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg tracking-wide">
              GARDIN <span className="text-marca-dourado">OS</span>
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="hover:text-marca-dourado">
                Ordens de Serviço
              </Link>
              <Link href="/nova" className="hover:text-marca-dourado">
                Nova OS
              </Link>
              <Link href="/financeiro" className="hover:text-marca-dourado">
                Financeiro
              </Link>
              <form action={sairDoSistema}>
                <button
                  type="submit"
                  className="text-neutral-400 hover:text-red-400"
                  title="Sair do sistema"
                >
                  Sair
                </button>
              </form>
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
          {children}
        </main>
        <footer className="text-center text-xs text-neutral-400 py-4">
          Gardin Comunicação Visual — sistema interno
        </footer>
      </body>
    </html>
  );
}
