import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

// ------------------------------------------------------------------
// Sessão do Financeiro: um cookie httpOnly assinado (HMAC), sem
// biblioteca externa. Não é um login por usuário — é só o "cadeado"
// da aba Financeiro, conforme pedido (todo mundo usa o sistema sem
// login, só o Financeiro pede senha).
// ------------------------------------------------------------------

const COOKIE_NAME = "gardin_financeiro_sessao";
const DURACAO_MS = 12 * 60 * 60 * 1000; // 12 horas

function getSecret(): string {
  const secret = process.env.FINANCEIRO_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "FINANCEIRO_SESSION_SECRET não configurado. Confira o arquivo .env.local (veja .env.example)."
    );
  }
  return secret;
}

function assinar(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function criarToken(): string {
  const expiraEm = Date.now() + DURACAO_MS;
  const payload = String(expiraEm);
  const assinatura = assinar(payload);
  return `${payload}.${assinatura}`;
}

function tokenValido(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, assinatura] = token.split(".");
  if (!payload || !assinatura) return false;

  const assinaturaEsperada = assinar(payload);
  const assinaturaBuffer = Buffer.from(assinatura);
  const esperadaBuffer = Buffer.from(assinaturaEsperada);
  if (assinaturaBuffer.length !== esperadaBuffer.length) return false;
  if (!crypto.timingSafeEqual(assinaturaBuffer, esperadaBuffer)) return false;

  const expiraEm = Number(payload);
  if (Number.isNaN(expiraEm) || Date.now() > expiraEm) return false;

  return true;
}

/** Chame dentro de uma Server Action, depois de validar a senha. */
export async function abrirSessaoFinanceiro() {
  const store = await cookies();
  store.set(COOKIE_NAME, criarToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_MS / 1000,
  });
}

/** Chame dentro de uma Server Action para "sair" do Financeiro. */
export async function encerrarSessaoFinanceiro() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Use em Server Components/Route Handlers para checar acesso. */
export async function temSessaoFinanceiro(): Promise<boolean> {
  const store = await cookies();
  return tokenValido(store.get(COOKIE_NAME)?.value);
}
