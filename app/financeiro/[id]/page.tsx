import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { temSessaoFinanceiro } from "@/lib/financeiroAuth";
import { salvarFinanceiroOS } from "@/lib/actions";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  FinanceiroOS,
  OrdemServico,
  STATUS_PAGAMENTO_LABEL,
  StatusPagamento,
} from "@/lib/tipos";

export const dynamic = "force-dynamic";

async function buscarOS(id: string): Promise<OrdemServico | null> {
  const { data } = await supabaseAdmin
    .from("ordens_servico")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data as OrdemServico | null;
}

async function buscarFinanceiro(osId: string): Promise<FinanceiroOS | null> {
  const { data } = await supabaseAdmin
    .from("financeiro_os")
    .select("*")
    .eq("os_id", osId)
    .maybeSingle();
  return data as FinanceiroOS | null;
}

const OPCOES_PAGAMENTO: StatusPagamento[] = ["nao_pago", "pago_parcial", "pago"];

export default async function FinanceiroDetalheOSPage({
  params,
}: {
  params: { id: string };
}) {
  // Checagem de sessão duplicada aqui de propósito: mesmo que alguém
  // acesse esta URL diretamente, sem passar pela lista, precisa da senha.
  const autenticado = await temSessaoFinanceiro();
  if (!autenticado) {
    redirect(`/financeiro?redirect=/financeiro/${params.id}`);
  }

  const os = await buscarOS(params.id);
  if (!os) notFound();

  const financeiro = await buscarFinanceiro(os.id);
  const salvar = salvarFinanceiroOS.bind(null, os.id);

  return (
    <div className="max-w-lg">
      <Link href="/financeiro" className="text-sm text-neutral-500 hover:underline">
        ← voltar
      </Link>
      <h1 className="text-xl font-bold mt-2 mb-4">
        Financeiro — OS #{os.numero} ({os.cliente})
      </h1>

      <form action={salvar} className="bg-white p-4 rounded shadow-sm flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1" htmlFor="valor_total">
              Valor total (R$)
            </label>
            <input
              id="valor_total"
              name="valor_total"
              type="number"
              step="0.01"
              min="0"
              defaultValue={financeiro?.valor_total ?? 0}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1" htmlFor="valor_pago">
              Valor pago (R$)
            </label>
            <input
              id="valor_pago"
              name="valor_pago"
              type="number"
              step="0.01"
              min="0"
              defaultValue={financeiro?.valor_pago ?? 0}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="status_pagamento">
            Status do pagamento
          </label>
          <select
            id="status_pagamento"
            name="status_pagamento"
            defaultValue={financeiro?.status_pagamento ?? "nao_pago"}
            className="w-full border rounded px-3 py-2"
          >
            {OPCOES_PAGAMENTO.map((opcao) => (
              <option key={opcao} value={opcao}>
                {STATUS_PAGAMENTO_LABEL[opcao]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="forma_pagamento">
            Forma de pagamento
          </label>
          <input
            id="forma_pagamento"
            name="forma_pagamento"
            defaultValue={financeiro?.forma_pagamento ?? ""}
            placeholder="Pix, dinheiro, cartão..."
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label
            className="block text-sm font-semibold mb-1"
            htmlFor="observacoes_financeiras"
          >
            Observações financeiras
          </label>
          <textarea
            id="observacoes_financeiras"
            name="observacoes_financeiras"
            rows={3}
            defaultValue={financeiro?.observacoes_financeiras ?? ""}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="bg-marca-preto text-marca-branco px-4 py-2 rounded font-semibold hover:bg-marca-dourado hover:text-marca-preto transition"
        >
          Salvar
        </button>
      </form>
    </div>
  );
}
