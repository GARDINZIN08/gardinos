import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { adicionarEtapa, salvarValorOS } from "@/lib/actions";
import StatusBadge from "@/components/StatusBadge";
import SeletorStatus from "@/components/SeletorStatus";
import AcoesEtapa from "@/components/AcoesEtapa";
import ExcluirOS from "@/components/ExcluirOS";
import { EtapaProducao, LIMITE_VALOR_PUBLICO, OrdemServico } from "@/lib/tipos";

export const dynamic = "force-dynamic";

async function buscarOS(id: string): Promise<OrdemServico | null> {
  const { data, error } = await supabaseAdmin
    .from("ordens_servico")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar OS: ${error.message}`);
  }

  return data as OrdemServico | null;
}

// Só lê o valor total — nada de valor_pago/status_pagamento aqui, isso
// continua exclusivo da aba Financeiro (protegida por senha).
async function buscarValorOS(osId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("financeiro_os")
    .select("valor_total")
    .eq("os_id", osId)
    .maybeSingle();

  return data?.valor_total ?? 0;
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function buscarEtapas(osId: string): Promise<EtapaProducao[]> {
  const { data, error } = await supabaseAdmin
    .from("etapas_producao")
    .select("*")
    .eq("os_id", osId)
    .order("ordem", { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar etapas: ${error.message}`);
  }

  return data as EtapaProducao[];
}

function formatarDataHora(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR");
}

function formatarData(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default async function DetalheOSPage({
  params,
}: {
  params: { id: string };
}) {
  const os = await buscarOS(params.id);
  if (!os) notFound();

  const etapas = await buscarEtapas(os.id);
  const valorAtual = await buscarValorOS(os.id);
  const adicionarEtapaComId = adicionarEtapa.bind(null, os.id);
  const salvarValorComId = salvarValorOS.bind(null, os.id);

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">OS #{os.numero}</h1>
          <StatusBadge status={os.status} />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Criada em {formatarDataHora(os.data_criacao)}
            {os.criado_por ? ` por ${os.criado_por}` : ""}
          </p>
          <ExcluirOS osId={os.id} osNumero={os.numero} />
        </div>
      </div>

      <div className="bg-white rounded shadow-sm p-4 flex flex-col gap-2">
        <div>
          <span className="text-xs font-semibold text-neutral-500 uppercase">
            Cliente
          </span>
          <p>{os.cliente}</p>
        </div>
        {os.telefone_cliente && (
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase">
              Telefone
            </span>
            <p>{os.telefone_cliente}</p>
          </div>
        )}
        <div>
          <span className="text-xs font-semibold text-neutral-500 uppercase">
            Descrição
          </span>
          <p className="whitespace-pre-wrap">{os.descricao}</p>
        </div>
        {os.observacoes && (
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase">
              Observações
            </span>
            <p className="whitespace-pre-wrap">{os.observacoes}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t mt-2">
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase">
              Responsável
            </span>
            <p>{os.responsavel || "—"}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase">
              Prazo
            </span>
            <p>{formatarData(os.data_prazo)}</p>
          </div>
        </div>
        {os.data_entrega && (
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase">
              Entregue em
            </span>
            <p>{formatarDataHora(os.data_entrega)}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded shadow-sm p-4">
        <h2 className="font-semibold mb-2">Status</h2>
        <SeletorStatus osId={os.id} statusAtual={os.status} />
      </div>

      <div className="bg-white rounded shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Valor</h2>
          <a
            href={`/api/os/${os.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-marca-preto underline hover:text-marca-dourado"
          >
            Gerar PDF
          </a>
        </div>
        {valorAtual <= LIMITE_VALOR_PUBLICO ? (
          <>
            <form action={salvarValorComId} className="flex gap-2 items-center">
              <span className="text-sm text-neutral-500">R$</span>
              <input
                name="valor_total"
                type="number"
                step="0.01"
                min="0"
                max={LIMITE_VALOR_PUBLICO}
                defaultValue={valorAtual}
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                type="submit"
                className="bg-marca-preto text-marca-branco px-3 py-2 rounded text-sm font-semibold hover:bg-marca-dourado hover:text-marca-preto transition"
              >
                Salvar
              </button>
            </form>
            <p className="text-xs text-neutral-400 mt-2">
              Valor atual: {formatarMoeda(valorAtual)}. Valores acima de{" "}
              {formatarMoeda(LIMITE_VALOR_PUBLICO)} só podem ser definidos
              pelo{" "}
              <Link href={`/financeiro/${os.id}`} className="underline">
                Financeiro
              </Link>{" "}
              (protegido por senha). Controle de pagamento (pago/não pago)
              também fica lá.
            </p>
          </>
        ) : (
          <p className="text-sm text-neutral-500">
            Valor acima de {formatarMoeda(LIMITE_VALOR_PUBLICO)} — disponível
            só na aba{" "}
            <Link href={`/financeiro/${os.id}`} className="underline">
              Financeiro
            </Link>{" "}
            (protegida por senha).
          </p>
        )}
      </div>

      <div className="bg-white rounded shadow-sm p-4">
        <h2 className="font-semibold mb-2">Etapas de produção</h2>
        {etapas.length > 0 ? (
          <ul className="mb-3">
            {etapas.map((etapa) => (
              <AcoesEtapa key={etapa.id} etapa={etapa} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-400 mb-3">
            Nenhuma etapa criada ainda. Adicione as etapas que fizerem
            sentido para este trabalho (ex: Serralheria, Pintura, Instalação).
          </p>
        )}
        <form action={adicionarEtapaComId} className="flex gap-2">
          <input
            name="titulo"
            placeholder="Nova etapa (ex: Recorte de adesivo)"
            className="flex-1 border rounded px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="bg-marca-preto text-marca-branco px-3 py-2 rounded text-sm font-semibold hover:bg-marca-dourado hover:text-marca-preto transition"
          >
            Adicionar
          </button>
        </form>
      </div>
    </div>
  );
}
