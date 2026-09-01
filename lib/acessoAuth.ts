// Controla o "cadeado" de acesso ao sistema INTEIRO (diferente do cadeado
// da aba Financeiro, que é separado e continua existindo por cima deste).
//
// Esse gate é verificado no middleware.ts, que roda no runtime "Edge" —
// por isso este arquivo usa a Web Crypto API (`crypto.subtle`), que
// funciona tanto no Edge quanto no Node (usado pela Server Action de
// login em lib/actions.ts). O módulo "crypto" do Node (usado em
// financeiroAuth.ts) NÃO funciona dentro do middleware.

export const COOKIE_NAME_ACESSO = "gardin_acesso_sessao";
const DURACAO_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

function paraHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function chaveHmac(segredo: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(segredo),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function assinar(payload: string, segredo: string): Promise<string> {
  const chave = await chaveHmac(segredo);
  const assinatura = await crypto.subtle.sign(
    "HMAC",
    chave,
    new TextEncoder().encode(payload)
  );
  return paraHex(assinatura);
}

function segredoConfigurado(): string | null {
  return process.env.FINANCEIRO_SESSION_SECRET || null;
}

/** Gera o valor do cookie de acesso (payload + assinatura), já pronto pra salvar. */
export async function criarTokenAcesso(): Promise<string> {
  const segredo = segredoConfigurado();
  if (!segredo) {
    throw new Error(
      "FINANCEIRO_SESSION_SECRET não configurado (usado também para assinar o acesso geral)."
    );
  }
  const expiraEm = Date.now() + DURACAO_MS;
  const payload = `acesso:${expiraEm}`;
  const assinatura = await assinar(payload, segredo);
  return `${payload}.${assinatura}`;
}

/** Confere se o valor do cookie de acesso é válido e ainda não expirou. */
export async function tokenAcessoValido(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  const segredo = segredoConfigurado();
  if (!segredo) return false;

  const pontoFinal = token.lastIndexOf(".");
  if (pontoFinal === -1) return false;
  const payload = token.slice(0, pontoFinal);
  const assinaturaRecebida = token.slice(pontoFinal + 1);

  const assinaturaEsperada = await assinar(payload, segredo);
  if (assinaturaEsperada.length !== assinaturaRecebida.length) return false;

  // Comparação em tempo constante (sem usar crypto.timingSafeEqual do Node,
  // que não existe no runtime Edge).
  let diferenca = 0;
  for (let i = 0; i < assinaturaEsperada.length; i++) {
    diferenca |= assinaturaEsperada.charCodeAt(i) ^ assinaturaRecebida.charCodeAt(i);
  }
  if (diferenca !== 0) return false;

  const [prefixo, expiraStr] = payload.split(":");
  if (prefixo !== "acesso") return false;
  const expiraEm = Number(expiraStr);
  if (!expiraEm || Number.isNaN(expiraEm)) return false;
  if (Date.now() > expiraEm) return false;

  return true;
}

export const DURACAO_COOKIE_SEGUNDOS = DURACAO_MS / 1000;
