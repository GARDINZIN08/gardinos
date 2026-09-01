import Link from "next/link";
import { temSessaoFinanceiro } from "@/lib/financeiroAuth";
import { loginFinanceiro, sairFinanceiro } from "@/lib/actions";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import StatusBadge from "@/components/StatusBadge";
import {
  FinanceiroOS,
  OrdemServico,
  STATUS_PAGAMENTO_LABEL,
} from "@/lib/tipos";

export const dynamic = "force-dynamic";

const MENSAGENS_ERRO: Record<string, string> = {
  "senha-incorreta": "Senha incorreta. Tente novamente.",
  "nao-configurado":
    "A senha do financeiro ainda não foi configurada. Veja o README.",
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function buscarTudo(): Promise<{
  ordens: OrdemServico[];
  financeiroPorOS: Record<string, FinanceiroOS>;
}> {
  const [{ data: ordens, error: erroOrdens }, { data: financeiro, error: erroFin }] =
    await Promise.all([
      supabaseAdmin
        .from("ordens_servico")
        .select("*")
        .order("data_criacao", { ascending: false }),
      supabaseAdmin.from("financeiro_os").select("*"),
    ]);

  if (erroOrdens) throw new Error(`Erro ao buscar OS: ${erroOrdens.message}`);
  if (erroFin) throw new Error(`Erro ao buscar financeiro: ${erroFin.message}`);

  const financeiroPorOS: Record<string, FinanceiroOS> = {};
  for (const linha of (financeiro ?? []) as FinanceiroOS[]) {
    financeiroPorOS[linha.os_id] = linha;
  }

  return { ordens: (ordens ?? []) as OrdemServico[], financeiroPorOS };
}

// Só aceitamos redirecionar de volta para dentro da própria área do
// Financeiro — nunca para um endereço externo vindo da URL.
function redirectSeguro(valor: string | undefined): string {
  if (valor && valor.startsWith("/financeiro/")) return valor;
  return "/financeiro";
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: { erro?: string; redirect?: string };
}) {
  const autenticado = await temSessaoFinanceiro();

  if (!autenticado) {
    const mensagemErro = searchParams.erro
      ? MENSAGENS_ERRO[searchParams.erro] ?? null
      : null;
    const destino = redirectSeguro(searchParams.redirect);

    return (
      <div className="max-w-sm mx-auto">
        <h1 className="text-xl font-bold mb-4">Financeiro</h1>
        <p className="text-sm text-neutral-500 mb-4">
          Esta área é protegida. Digite a senha do financeiro para continuar.
        </p>
        <form
          action={loginFinanceiro}
          className="bg-white p-4 rounded shadow-sm flex flex-col gap-3"
        >
          <input type="hidden" name="redirect" value={destino} />
          <input
            type="password"
            name="senha"
            required
            autoFocus
            placeholder="Senha do financeiro"
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
    );
  }

  const { ordens, financeiroPorOS } = await buscarTudo();

  const totalAReceber = ordens.reduce((soma, os) => {
    const f = financeiroPorOS[os.id];
    if (!f) return soma;
    return soma + (f.valor_total - f.valor_pago);
  }, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Financeiro</h1>
        <form action={sairFinanceiro}>
          <button
            type="submit"
            className="text-sm text-neutral-500 hover:text-red-600"
          >
            Sair do financeiro
          </button>
        </form>
      </div>

      <div className="bg-white rounded shadow-sm p-4 mb-4">
        <span className="text-xs font-semibold text-neutral-500 uppercase">
          Total a receber (todas as OS)
        </span>
        <p className="text-2xl font-bold">{formatarMoeda(totalAReceber)}</p>
      </div>

      <div className="bg-white rounded shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left">
            <tr>
              <th className="px-3 py-2">OS</th>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Valor total</th>
              <th className="px-3 py-2">Pago</th>
              <th className="px-3 py-2">Pagamento</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {ordens.map((os) => {
              const f = financeiroPorOS[os.id];
              return (
                <tr key={os.id} className="border-t">
                  <td className="px-3 py-2">#{os.numero}</td>
                  <td className="px-3 py-2">{os.cliente}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={os.status} />
                  </td>
                  <td className="px-3 py-2">
                    {formatarMoeda(f?.valor_total ?? 0)}
                  </td>
                  <td className="px-3 py-2">
                    {formatarMoeda(f?.valor_pago ?? 0)}
                  </td>
                  <td className="px-3 py-2">
                    {STATUS_PAGAMENTO_LABEL[f?.status_pagamento ?? "nao_pago"]}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/financeiro/${os.id}`}
                      className="text-marca-dourado font-semibold hover:underline"
                    >
                      editar
                    </Link>
                  </td>
                </tr>
              );
            })}
            {ordens.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-neutral-400">
                  Nenhuma OS cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
