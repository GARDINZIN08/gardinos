import { entrarNoSistema } from "@/lib/actions";

export const dynamic = "force-dynamic";

const MENSAGENS_ERRO: Record<string, string> = {
  "senha-incorreta": "Senha incorreta. Tente novamente.",
  "nao-configurado":
    "A senha de acesso ainda não foi configurada (variável ACESSO_SENHA). Veja o README.",
};

// Só aceitamos redirecionar de volta para dentro do próprio site — nunca
// para um endereço externo vindo da URL.
function redirectSeguro(valor: string | undefined): string {
  if (valor && valor.startsWith("/") && !valor.startsWith("//")) return valor;
  return "/";
}

export default function EntrarPage({
  searchParams,
}: {
  searchParams: { erro?: string; redirect?: string };
}) {
  const mensagemErro = searchParams.erro
    ? MENSAGENS_ERRO[searchParams.erro] ?? null
    : null;
  const destino = redirectSeguro(searchParams.redirect);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <h1 className="text-xl font-bold mb-1 text-center">
          GARDIN <span className="text-marca-dourado">OS</span>
        </h1>
        <p className="text-sm text-neutral-500 mb-4 text-center">
          Digite a senha de acesso para continuar.
        </p>
        <form
          action={entrarNoSistema}
          className="bg-white p-4 rounded shadow-sm flex flex-col gap-3"
        >
          <input type="hidden" name="redirect" value={destino} />
          <input
            type="password"
            name="senha"
            required
            autoFocus
            placeholder="Senha de acesso"
            className="w-full border rounded px-3 py-2"
          />
          {mensagemErro && (
            <p className="text-sm text-red-600">{mensagemErro}</p>
          )}
          <button
            type="submit"
            className="bg-marca-preto text-marca-branco px-4 py-2 rounded font-semibold hover:bg-marca-dourado hover:text-marca-preto transition"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
