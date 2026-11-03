import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME_ACESSO, tokenAcessoValido } from "@/lib/acessoAuth";

// Protege o sistema INTEIRO com uma senha única (definida em ACESSO_SENHA).
// Sem isso, qualquer pessoa que descobrisse o link público conseguiria
// criar/ver Ordens de Serviço. A aba Financeiro continua tendo a sua
// própria senha separada, por cima desta.
export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME_ACESSO)?.value;
  const autenticado = await tokenAcessoValido(token);

  if (autenticado) {
    return NextResponse.next();
  }

  const destino = request.nextUrl.pathname + request.nextUrl.search;
  const url = request.nextUrl.clone();
  url.pathname = "/entrar";
  url.search = "";
  if (destino && destino !== "/") {
    url.searchParams.set("redirect", destino);
  }
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Roda em tudo, EXCETO: arquivos estáticos internos do Next, o
    // favicon e a própria página/ação de login (senão ninguém consegue
    // nem ver o formulário de senha).
    "/((?!_next/static|_next/image|favicon.ico|entrar|api/keep-alive).*)",
  ],
};
